import { Model, Types, isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { User, UserDocument, SavedAddress } from '../schemas/user.schema';
import { hashPassword } from '@/utils/password';
import { generateUsers } from '@/utils/seed-users';
import { PaginatedResponse } from '@/types';
import { Role } from '@/types/role.enum';

import { AdminProfileDto } from '../dtos/admin.profile.dto';
import { CreateAddressDto } from '../dtos/address.dto';
import { AwsS3Service } from '@/aws-s3/aws-s3.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async findByEmail(email: string) {
    // Convert to lowercase to ensure case-insensitive matching
    const lowercaseEmail = email.toLowerCase();
    return this.userModel.findOne({ email: lowercaseEmail }).exec();
  }

  async create(user: Partial<User>): Promise<UserDocument> {
    try {
      const existingUser = await this.findByEmail(
        user.email?.toLowerCase() ?? '',
      );

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await hashPassword(user.password ?? '');

      // Store email in lowercase
      return await this.userModel.create({
        ...user,
        email: user.email?.toLowerCase(),
        password: hashedPassword,
        role: user.role ?? Role.User,
      });
    } catch (error: any) {
      this.logger.error(`Failed to create user: ${error.message}`);

      if (error.code === 11000) {
        throw new BadRequestException('Email already exists');
      }

      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException('Failed to create user');
    }
  }

  async createMany(users: Partial<User>[]): Promise<UserDocument[]> {
    try {
      const usersWithLowercaseEmails = users.map((user) => ({
        ...user,
        email: user.email?.toLowerCase(),
      }));
      return (await this.userModel.insertMany(
        usersWithLowercaseEmails,
      )) as unknown as UserDocument[];
    } catch (error: any) {
      this.logger.error(`Failed to create users: ${error.message}`);
      throw new BadRequestException('Failed to create users');
    }
  }

  async findOne(email: string): Promise<UserDocument | null> {
    return this.findByEmail(email);
  }

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<UserDocument>> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments({}),
    ]);

    return {
      items: users,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async deleteOne(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const result = await this.userModel.findOneAndDelete({ _id: id });
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async update(
    id: string,
    attrs: Partial<User>,
    adminRole = false,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Only validate email if it's being updated
    if (attrs.email && attrs.email !== user.email) {
      attrs.email = attrs.email.toLowerCase();

      const existingUser = await this.findByEmail(attrs.email);
      if (existingUser && existingUser._id.toString() !== id) {
        throw new BadRequestException('Email is already in use');
      }
    }

    // Handle password update if provided
    if (attrs.password && !adminRole) {
      const passwordMatch = await bcrypt.compare(attrs.password, user.password);
      if (passwordMatch) {
        throw new BadRequestException(
          'New password must be different from the current password',
        );
      }
      attrs.password = await hashPassword(attrs.password);
    }

    // Prepare update data, filter out undefined values
    const updateData = { ...attrs };

    // Prevent role changes unless admin
    if (!adminRole) delete updateData.role;

    // Filter out undefined values to ensure only provided fields are updated
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`User ${id} updated successfully`);
      return updatedUser;
    } catch (error: any) {
      this.logger.error(`Failed to update user ${id}: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to update user');
    }
  }

  async adminUpdate(id: string, updateDto: AdminProfileDto) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Convert email to lowercase if provided
      if (updateDto.email) {
        updateDto.email = updateDto.email.toLowerCase();

        // Check if the email is already in use by another user
        const existingUser = await this.findByEmail(updateDto.email);
        if (existingUser && existingUser._id.toString() !== id) {
          throw new ConflictException('Email already exists');
        }
      }

      // Update fields only if they are provided
      if (updateDto.name) user.name = updateDto.name;
      if (updateDto.email) user.email = updateDto.email;
      if (updateDto.role) user.role = updateDto.role;

      // Only hash and update password if it's provided and not empty
      if (updateDto.password && updateDto.password.trim() !== '') {
        this.logger.log('Updating password for user', id);
        user.password = await hashPassword(updateDto.password);
      }

      await user.save();
      return user;
    } catch (error) {
      this.logger.error(`Failed to update user: ${error.message}`);
      throw error;
    }
  }

  async deleteMany(): Promise<void> {
    try {
      await this.userModel.deleteMany({});
      this.logger.log('All users deleted successfully');
    } catch (error: any) {
      this.logger.error(`Failed to delete users: ${error.message}`);
      throw new BadRequestException('Failed to delete users');
    }
  }

  async generateUsers(count: number): Promise<UserDocument[]> {
    const generatedUsers = await generateUsers(count);
    return this.createMany(generatedUsers);
  }

  async updateProfileImage(
    userId: string,
    filePath: string,
    fileBuffer: Buffer,
  ) {
    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Delete old image if it exists
      if (user.profileImagePath) {
        try {
          await this.awsS3Service.deleteImageByFileId(
            user.profileImagePath as string,
          );
        } catch (error) {
          console.error('Failed to delete old profile image', error);
          // Continue even if deletion fails
        }
      }

      // Upload new image
      const profileImagePath = await this.awsS3Service.uploadImage(
        filePath,
        fileBuffer,
      );

      // Update user record
      await this.userModel.findByIdAndUpdate(userId, { profileImagePath });

      // Get image URL
      const imageUrl =
        await this.awsS3Service.getImageByFileId(profileImagePath);

      return {
        message: 'Profile image updated successfully',
        profileImage: imageUrl,
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to update profile image: ' + error.message,
      );
    }
  }

  async uploadImage(filePath: string, fileBuffer: Buffer): Promise<string> {
    try {
      return await this.awsS3Service.uploadImage(filePath, fileBuffer);
    } catch (error) {
      this.logger.error(`Failed to upload image: ${error.message}`);
      throw new BadRequestException('Failed to upload image: ' + error.message);
    }
  }

  async getProfileData(userId: string) {
    const user = await this.userModel.findById(userId, { password: 0 });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get profile image URL if it exists
    let profileImage = null;
    if (user.profileImagePath) {
      // Check if it's a Cloudinary URL (new format) or AWS S3 (legacy format)
      if (user.profileImagePath.includes('cloudinary.com')) {
        // For Cloudinary URLs, return as is
        profileImage = user.profileImagePath;
      } else {
        // For legacy AWS S3 paths, get signed URL
        profileImage = await this.awsS3Service.getImageByFileId(
          user.profileImagePath as string,
        );
      }
    }

    return {
      ...user.toObject(),
      profileImage,
    };
  }

  async getProfileImageUrl(profileImagePath: string): Promise<string | null> {
    if (!profileImagePath) return null;
    try {
      return await this.awsS3Service.getImageByFileId(profileImagePath);
    } catch (error) {
      this.logger.error(`Failed to get image URL: ${error.message}`);
      return null;
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove user's profile image if exists
    if (user.profileImagePath) {
      try {
        await this.awsS3Service.deleteImageByFileId(
          user.profileImagePath as string,
        );
      } catch (error) {
        console.error('Failed to delete profile image', error);
        // Continue even if image deletion fails
      }
    }

    await this.userModel.findByIdAndDelete(id);
    return { message: 'User deleted successfully' };
  }

  // ============ Address Management Methods ============

  async getAddresses(userId: string): Promise<SavedAddress[]> {
    const user = await this.findById(userId);
    return user.savedAddresses || [];
  }

  async addAddress(
    userId: string,
    addressDto: CreateAddressDto,
  ): Promise<SavedAddress[]> {
    const user = await this.findById(userId);

    const newAddress: SavedAddress = {
      id: uuidv4(),
      ...addressDto,
      isDefault: addressDto.isDefault || false,
    };

    // If this is the first address or set as default, make it default
    if (!user.savedAddresses || user.savedAddresses.length === 0) {
      newAddress.isDefault = true;
    } else if (newAddress.isDefault) {
      // Remove default from other addresses
      user.savedAddresses = user.savedAddresses.map((addr) => ({
        ...addr,
        isDefault: false,
      }));
    }

    user.savedAddresses = [...(user.savedAddresses || []), newAddress];
    await user.save();

    return user.savedAddresses;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    addressDto: CreateAddressDto,
  ): Promise<SavedAddress[]> {
    const user = await this.findById(userId);

    if (!user.savedAddresses) {
      throw new NotFoundException('No addresses found');
    }

    const addressIndex = user.savedAddresses.findIndex(
      (addr) => addr.id === addressId,
    );

    if (addressIndex === -1) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, remove default from others
    if (addressDto.isDefault) {
      user.savedAddresses = user.savedAddresses.map((addr) => ({
        ...addr,
        isDefault: false,
      }));
    }

    user.savedAddresses[addressIndex] = {
      ...user.savedAddresses[addressIndex],
      ...addressDto,
      id: addressId,
    };

    await user.save();
    return user.savedAddresses;
  }

  async deleteAddress(
    userId: string,
    addressId: string,
  ): Promise<SavedAddress[]> {
    const user = await this.findById(userId);

    if (!user.savedAddresses) {
      throw new NotFoundException('No addresses found');
    }

    const deletedAddress = user.savedAddresses.find(
      (addr) => addr.id === addressId,
    );

    if (!deletedAddress) {
      throw new NotFoundException('Address not found');
    }

    user.savedAddresses = user.savedAddresses.filter(
      (addr) => addr.id !== addressId,
    );

    // If deleted address was default and there are other addresses, make first one default
    if (deletedAddress.isDefault && user.savedAddresses.length > 0) {
      user.savedAddresses[0].isDefault = true;
    }

    await user.save();
    return user.savedAddresses;
  }

  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<SavedAddress[]> {
    const user = await this.findById(userId);

    if (!user.savedAddresses) {
      throw new NotFoundException('No addresses found');
    }

    const addressExists = user.savedAddresses.some(
      (addr) => addr.id === addressId,
    );

    if (!addressExists) {
      throw new NotFoundException('Address not found');
    }

    user.savedAddresses = user.savedAddresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));

    await user.save();
    return user.savedAddresses;
  }
}
