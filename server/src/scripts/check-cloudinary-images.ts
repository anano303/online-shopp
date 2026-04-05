import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { ProductsService } from '../products/services/products.service';

async function checkCloudinaryImages() {
  console.log('🔍 Checking Cloudinary images in database...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const productsService = app.get(ProductsService);

  try {
    // Get all products
    const allProducts = await productsService.findMany({
      page: '1',
      limit: '1000',
    });

    console.log(`📦 Total products: ${allProducts.items.length}`);

    // Count images by cloud
    let oldCloudImages = 0;
    let newCloudImages = 0;
    let otherImages = 0;
    let totalImages = 0;

    const productsWithOldImages = [];

    for (const product of allProducts.items) {
      const productImages = (product as any).images || [];
      totalImages += productImages.length;

      let hasOldImages = false;

      for (const imageUrl of productImages) {
        if (imageUrl.includes('dsufx8uzd')) {
          oldCloudImages++;
          hasOldImages = true;
        } else if (imageUrl.includes('dcnz1iv0m')) {
          newCloudImages++;
        } else {
          otherImages++;
        }
      }

      if (hasOldImages) {
        productsWithOldImages.push({
          id: (product as any)._id,
          name: (product as any).name,
          imageCount: productImages.length,
        });
      }
    }

    console.log('\n📊 Image Statistics:');
    console.log('==================');
    console.log(`📷 Total images: ${totalImages}`);
    console.log(`🔄 Old cloud (dsufx8uzd): ${oldCloudImages}`);
    console.log(`✅ New cloud (dcnz1iv0m): ${newCloudImages}`);
    console.log(`🌍 Other sources: ${otherImages}`);

    console.log(
      `\n🔄 Products needing migration: ${productsWithOldImages.length}`,
    );

    if (productsWithOldImages.length > 0) {
      console.log('\n📋 Products with old Cloudinary images:');
      console.log('=====================================');
      productsWithOldImages.slice(0, 10).forEach((product, index) => {
        console.log(
          `${index + 1}. ${product.name} (${product.imageCount} images)`,
        );
      });

      if (productsWithOldImages.length > 10) {
        console.log(
          `... and ${productsWithOldImages.length - 10} more products`,
        );
      }

      console.log('\n🚀 Ready to run migration!');
      console.log('Use: npm run migrate-cloudinary');
    } else {
      console.log(
        '\n✅ All images are already using new cloud or other sources!',
      );
    }
  } catch (error) {
    console.error('💥 Error checking images:', error);
  } finally {
    await app.close();
  }
}

// Run check
checkCloudinaryImages()
  .then(() => {
    console.log('\n🏁 Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });
