import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { ProductsService } from '../products/services/products.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner } from '../banners/schemas/banner.schema';
import { User } from '../users/schemas/user.schema';
import { v2 as cloudinary } from 'cloudinary';

// Configure old Cloudinary instance
const oldCloudinary = cloudinary;
oldCloudinary.config({
  cloud_name: 'dsufx8uzd', // Old cloud name
  api_key: process.env.CLOUDINARY_API_KEY_OLD,
  api_secret: process.env.CLOUDINARY_API_SECRET_OLD,
  secure: true,
});

// Configure new Cloudinary instance
const newCloudinary = require('cloudinary').v2;
newCloudinary.config({
  cloud_name: 'dcnz1iv0m', // New cloud name
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function migrateImage(imageUrl: string): Promise<string> {
  if (!imageUrl.includes('dsufx8uzd')) {
    return imageUrl; // Skip if not old cloud
  }

  try {
    // Download image from old cloud
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Upload to new cloud
    const uploadResult = await new Promise<any>((resolve, reject) => {
      newCloudinary.uploader
        .upload_stream(
          {
            folder: 'ecommerce',
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(imageBuffer);
    });

    return uploadResult.secure_url;
  } catch (error) {
    console.log(`   ❌ Failed to migrate: ${error.message}`);
    return imageUrl; // Keep original if migration fails
  }
}

async function migrateAllCloudinaryImages() {
  console.log('🚀 Starting COMPLETE Cloudinary Migration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const bannerModel = app.get('BannerModel') as Model<Banner>;
    const userModel = app.get('UserModel') as Model<User>;
    const productsService = app.get(ProductsService);

    let totalMigrated = 0;
    let totalFailed = 0;

    // 1. Migrate Products (including brandLogo)
    console.log('1️⃣ MIGRATING PRODUCTS...');
    const products = await productsService.findMany({
      page: '1',
      limit: '1000',
    });

    for (let i = 0; i < products.items.length; i++) {
      const product = products.items[i] as any;
      let needsUpdate = false;

      console.log(`\n[${i + 1}/${products.items.length}] ${product.name}`);

      // Migrate product images
      const newImages = [];
      for (const imageUrl of product.images) {
        if (imageUrl.includes('dsufx8uzd')) {
          console.log(`   🔄 Migrating image...`);
          const newUrl = await migrateImage(imageUrl);
          if (newUrl !== imageUrl) {
            totalMigrated++;
            console.log(`   ✅ Success`);
          } else {
            totalFailed++;
          }
          newImages.push(newUrl);
          needsUpdate = true;
        } else {
          newImages.push(imageUrl);
        }

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Migrate brandLogo
      let newBrandLogo = product.brandLogo;
      if (product.brandLogo && product.brandLogo.includes('dsufx8uzd')) {
        console.log(`   🔄 Migrating brand logo...`);
        newBrandLogo = await migrateImage(product.brandLogo);
        if (newBrandLogo !== product.brandLogo) {
          totalMigrated++;
          console.log(`   ✅ Brand logo migrated`);
          needsUpdate = true;
        } else {
          totalFailed++;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Update product if needed
      if (needsUpdate) {
        try {
          await productsService.update(product._id.toString(), {
            images: newImages,
            brandLogo: newBrandLogo,
          });
          console.log(`   💾 Product updated`);
        } catch (error) {
          console.log(`   ❌ Database update failed: ${error.message}`);
        }
      }
    }

    // 2. Migrate Banners
    console.log('\n\n2️⃣ MIGRATING BANNERS...');
    const banners = await bannerModel.find({}).exec();

    for (let i = 0; i < banners.length; i++) {
      const banner = banners[i];
      console.log(`\n[${i + 1}/${banners.length}] ${banner.title}`);

      if (banner.imageUrl && banner.imageUrl.includes('dsufx8uzd')) {
        console.log(`   🔄 Migrating banner image...`);
        const newImageUrl = await migrateImage(banner.imageUrl);

        if (newImageUrl !== banner.imageUrl) {
          totalMigrated++;
          console.log(`   ✅ Success`);

          // Update banner
          try {
            await bannerModel.findByIdAndUpdate(banner._id, {
              imageUrl: newImageUrl,
            });
            console.log(`   💾 Banner updated`);
          } catch (error) {
            console.log(`   ❌ Banner update failed: ${error.message}`);
          }
        } else {
          totalFailed++;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // 3. Migrate Users (if any have old profile images)
    console.log('\n\n3️⃣ MIGRATING USERS...');
    const users = await userModel.find({}).exec();

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      if (
        user.profileImagePath &&
        user.profileImagePath.includes('dsufx8uzd')
      ) {
        console.log(`\n[${i + 1}/${users.length}] ${user.name}`);
        console.log(`   🔄 Migrating profile image...`);

        const newProfileImage = await migrateImage(user.profileImagePath);

        if (newProfileImage !== user.profileImagePath) {
          totalMigrated++;
          console.log(`   ✅ Success`);

          // Update user
          try {
            await userModel.findByIdAndUpdate(user._id, {
              profileImagePath: newProfileImage,
            });
            console.log(`   💾 User updated`);
          } catch (error) {
            console.log(`   ❌ User update failed: ${error.message}`);
          }
        } else {
          totalFailed++;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Final summary
    console.log('\n🎉 COMPLETE MIGRATION FINISHED!');
    console.log('===============================');
    console.log(`✅ Successfully migrated: ${totalMigrated} images`);
    console.log(`❌ Failed migrations: ${totalFailed} images`);
    console.log(
      `📊 Success rate: ${totalMigrated > 0 ? ((totalMigrated / (totalMigrated + totalFailed)) * 100).toFixed(1) : 0}%`,
    );
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await app.close();
  }
}

// Run migration
migrateAllCloudinaryImages()
  .then(() => {
    console.log('\n🏁 Complete migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Complete migration script failed:', error);
    process.exit(1);
  });
