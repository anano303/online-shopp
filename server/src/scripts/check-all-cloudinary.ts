import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { ProductsService } from '../products/services/products.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner } from '../banners/schemas/banner.schema';
import { User } from '../users/schemas/user.schema';

async function checkAllCloudinaryUsage() {
  console.log('🔍 Checking ALL Cloudinary usage across the system...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get models directly
    const bannerModel = app.get('BannerModel') as Model<Banner>;
    const userModel = app.get('UserModel') as Model<User>;
    const productsService = app.get(ProductsService);

    console.log('📊 Scanning different collections...\n');

    // 1. Check Products (we already know these are migrated)
    console.log('1️⃣ PRODUCTS:');
    const products = await productsService.findMany({
      page: '1',
      limit: '1000',
    });
    let productOldImages = 0;
    let productNewImages = 0;

    for (const product of products.items) {
      const images = [(product as any).images || [], (product as any).brandLogo]
        .flat()
        .filter(Boolean);
      for (const img of images) {
        if (img.includes('dsufx8uzd')) productOldImages++;
        else if (img.includes('dcnz1iv0m')) productNewImages++;
      }
    }

    console.log(`   📷 Old cloud images: ${productOldImages}`);
    console.log(`   ✅ New cloud images: ${productNewImages}`);

    // 2. Check Banners
    console.log('\n2️⃣ BANNERS:');
    try {
      const banners = await bannerModel.find({}).exec();
      let bannerOldImages = 0;
      let bannerNewImages = 0;
      const bannersWithOldImages = [];

      for (const banner of banners) {
        const images = [banner.imageUrl].filter(Boolean);
        let hasOldImages = false;

        for (const img of images) {
          if (img.includes('dsufx8uzd')) {
            bannerOldImages++;
            hasOldImages = true;
          } else if (img.includes('dcnz1iv0m')) {
            bannerNewImages++;
          }
        }

        if (hasOldImages) {
          bannersWithOldImages.push({
            id: banner._id,
            title: banner.title,
            imageUrl: banner.imageUrl,
          });
        }
      }

      console.log(`   📷 Old cloud images: ${bannerOldImages}`);
      console.log(`   ✅ New cloud images: ${bannerNewImages}`);
      console.log(
        `   🔄 Banners needing migration: ${bannersWithOldImages.length}`,
      );

      if (bannersWithOldImages.length > 0) {
        console.log('   📋 Banners with old images:');
        bannersWithOldImages.forEach((banner, index) => {
          console.log(`      ${index + 1}. ${banner.title || 'Untitled'}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error checking banners: ${error.message}`);
    }

    // 3. Check Users (profile images, store logos)
    console.log('\n3️⃣ USERS:');
    try {
      const users = await userModel.find({}).exec();
      let userOldImages = 0;
      let userNewImages = 0;
      const usersWithOldImages = [];

      for (const user of users) {
        const images = [user.profileImagePath].filter(Boolean);

        let hasOldImages = false;

        for (const img of images) {
          if (img.includes('dsufx8uzd')) {
            userOldImages++;
            hasOldImages = true;
          } else if (img.includes('dcnz1iv0m')) {
            userNewImages++;
          }
        }

        if (hasOldImages) {
          usersWithOldImages.push({
            id: user._id,
            name: user.name,
            email: user.email,
            profileImagePath: user.profileImagePath,
          });
        }
      }

      console.log(`   📷 Old cloud images: ${userOldImages}`);
      console.log(`   ✅ New cloud images: ${userNewImages}`);
      console.log(
        `   🔄 Users needing migration: ${usersWithOldImages.length}`,
      );

      if (usersWithOldImages.length > 0) {
        console.log('   📋 Users with old images:');
        usersWithOldImages.slice(0, 10).forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.name} (${user.email})`);
        });
        if (usersWithOldImages.length > 10) {
          console.log(
            `      ... and ${usersWithOldImages.length - 10} more users`,
          );
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking users: ${error.message}`);
    }

    // 4. Summary
    console.log('\n📊 SUMMARY:');
    console.log('=============');

    console.log(`🔄 Total old cloud images found: ${productOldImages}`);
    console.log(`✅ Total new cloud images found: ${productNewImages}`);

    if (productOldImages > 0) {
      console.log('\n🚀 Migration needed for products');
    } else {
      console.log('\n✅ All images are already using new cloud!');
    }
  } catch (error) {
    console.error('💥 Error checking system:', error);
  } finally {
    await app.close();
  }
}

// Run check
checkAllCloudinaryUsage()
  .then(() => {
    console.log('\n🏁 System check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 System check failed:', error);
    process.exit(1);
  });
