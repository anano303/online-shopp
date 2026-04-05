import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { UsersService } from '../users/services/users.service';
import { CloudinaryService } from '../cloudinary/services/cloudinary.service';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import * as fs from 'fs';
import * as path from 'path';

async function migrateProfileImagesToCloudinary() {
  console.log('🚀 Starting Profile Images Migration to Cloudinary...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userModel = app.get('UserModel') as Model<User>;
    const cloudinaryService = app.get(CloudinaryService);

    // Get users with profile images
    const users = await userModel
      .find({
        profileImagePath: { $exists: true, $ne: null },
      })
      .exec();

    console.log(`👥 Found ${users.length} users with profile images\n`);

    if (users.length === 0) {
      console.log('✅ No profile images to migrate');
      return;
    }

    let migratedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      console.log(`[${i + 1}/${users.length}] Processing: ${user.name}`);
      console.log(`📷 Current path: ${user.profileImagePath}`);

      // Skip if already using Cloudinary
      if (user.profileImagePath.includes('cloudinary.com')) {
        console.log('✅ Already using Cloudinary - skipping\n');
        continue;
      }

      try {
        // Download image from AWS S3
        console.log('⏳ Downloading from AWS S3...');
        const awsS3Service = app.get(AwsS3Service);
        const imageUrl = await awsS3Service.getImageByFileId(
          user.profileImagePath,
        );

        if (!imageUrl) {
          console.log('❌ Failed to get image URL from AWS S3 - skipping\n');
          failedCount++;
          continue;
        }

        // Fetch the image data
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.log('❌ Failed to download image from AWS S3 - skipping\n');
          failedCount++;
          continue;
        }

        const fileBuffer = Buffer.from(await response.arrayBuffer());

        // Upload to Cloudinary
        console.log('⏳ Uploading to Cloudinary...');
        const cloudinaryUrl = await cloudinaryService.uploadBuffer(
          fileBuffer,
          'profile-images',
        );

        // Update user record
        await userModel.findByIdAndUpdate(user._id, {
          profileImagePath: cloudinaryUrl,
        });

        console.log(`✅ Success: ${cloudinaryUrl}`);
        console.log(`💾 User updated\n`);

        migratedCount++;

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`❌ Failed: ${error.message}\n`);
        failedCount++;
      }
    }

    // Final summary
    console.log('🎉 PROFILE IMAGES MIGRATION COMPLETE!');
    console.log('=====================================');
    console.log(`👥 Users processed: ${users.length}`);
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`❌ Failed migrations: ${failedCount}`);
    console.log(
      `📊 Success rate: ${users.length > 0 ? ((migratedCount / users.length) * 100).toFixed(1) : 0}%`,
    );
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await app.close();
  }
}

// Run migration
migrateProfileImagesToCloudinary()
  .then(() => {
    console.log('\n🏁 Profile images migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Profile images migration script failed:', error);
    process.exit(1);
  });
