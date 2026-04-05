import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { DEFAULT_CATEGORY_STRUCTURE } from '../categories.constants';
import { AppService } from '@/app/services/app.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private appService: AppService,
  ) {}

  async findAll(includeInactive = false): Promise<Category[]> {
    const filter = includeInactive ? {} : { isActive: true };
    return this.categoryModel.find(filter).sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<Category> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid category ID format: ${id}`);
    }

    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findByName(name: string): Promise<Category> {
    if (!name || name.trim() === '') {
      throw new BadRequestException('Category name cannot be empty');
    }

    const category = await this.categoryModel
      .findOne({ name: name.trim() })
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with name ${name} not found`);
    }
    return category;
  }

  async create(
    createCategoryDto: CreateCategoryDto,
    iconFile?: Express.Multer.File,
  ): Promise<Category> {
    // Normalize name to prevent duplicates with different cases or whitespace
    const normalizedName = createCategoryDto.name.trim();

    // Check if a category with the same name exists (case insensitive)
    const existingCategory = await this.categoryModel
      .findOne({
        name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      })
      .exec();

    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${normalizedName}" already exists`,
      );
    }

    // Upload icon if provided
    let iconUrl: string | undefined;
    if (iconFile) {
      iconUrl = await this.appService.uploadImageToCloudinary(iconFile);
    }

    // Create new category
    // Parse isActive from string to boolean if needed (for multipart form data)
    const isActive =
      typeof createCategoryDto.isActive === 'string'
        ? createCategoryDto.isActive === 'true'
        : (createCategoryDto.isActive ?? true);

    const newCategory = new this.categoryModel({
      name: normalizedName,
      nameEn: createCategoryDto.nameEn?.trim() || undefined,
      description: createCategoryDto.description?.trim() || undefined,
      descriptionEn: createCategoryDto.descriptionEn?.trim() || undefined,
      icon: iconUrl,
      isActive,
    });

    return newCategory.save();
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    iconFile?: Express.Multer.File,
  ): Promise<Category> {
    console.log('=== Update Category Service ===');
    console.log('Icon file received:', iconFile ? 'YES' : 'NO');
    if (iconFile) {
      console.log('Icon file details:', {
        fieldname: iconFile.fieldname,
        originalname: iconFile.originalname,
        mimetype: iconFile.mimetype,
        size: iconFile.size,
      });
    }
    console.log('Update DTO:', updateCategoryDto);

    // Check if updating name and if it already exists
    if (updateCategoryDto.name) {
      const existingCategory = await this.categoryModel
        .findOne({
          name: updateCategoryDto.name,
          _id: { $ne: id },
        })
        .exec();

      if (existingCategory) {
        throw new ConflictException(
          `Category with name ${updateCategoryDto.name} already exists`,
        );
      }
    }

    // Upload new icon if provided
    const updateData: any = { ...updateCategoryDto };
    if (iconFile) {
      console.log('Uploading icon to Cloudinary...');
      const iconUrl = await this.appService.uploadImageToCloudinary(iconFile);
      console.log('Icon uploaded successfully:', iconUrl);
      updateData.icon = iconUrl;
    }

    // Parse isActive from string to boolean if needed (for multipart form data)
    if (
      updateData.isActive !== undefined &&
      typeof updateData.isActive === 'string'
    ) {
      updateData.isActive = updateData.isActive === 'true';
    }

    // Trim string fields
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.nameEn) updateData.nameEn = updateData.nameEn.trim();
    if (updateData.description)
      updateData.description = updateData.description.trim();
    if (updateData.descriptionEn)
      updateData.descriptionEn = updateData.descriptionEn.trim();

    console.log('Update data to be saved:', updateData);

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    console.log('Updated category from DB:', updatedCategory);
    console.log('Has icon in response:', updatedCategory.icon ? 'YES' : 'NO');

    return updatedCategory;
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  getDefaultAttributes() {
    return DEFAULT_CATEGORY_STRUCTURE;
  }
}
