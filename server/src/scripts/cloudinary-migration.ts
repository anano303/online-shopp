import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { ProductsService } from '../products/services/products.service';
import { ProductDocument } from '../products/schemas/product.schema';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from '../cloudinary/services/cloudinary.service';

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
  api_key: process.env.CLOUDINARY_API_KEY, // Use current env vars since they're already for new cloud
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function migrateCloudinaryImages() {
  console.log('🚀 Starting Cloudinary Migration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const productsService = app.get(ProductsService);

  try {
    // Get all products with Cloudinary images
    console.log('📊 Fetching all products...');
    const allProducts = await productsService.findMany({
      page: '1',
      limit: '1000', // Get all products
    });

    console.log(`📦 Found ${allProducts.items.length} products total`);

    // Filter products with old Cloudinary URLs
    const productsWithOldImages = allProducts.items.filter((product) =>
      product.images.some((img) => img.includes('dsufx8uzd')),
    );

    console.log(
      `🔄 Found ${productsWithOldImages.length} products with old Cloudinary images\n`,
    );

    if (productsWithOldImages.length === 0) {
      console.log(
        '✅ No migration needed - all images are already using new cloud!',
      );
      return;
    }

    let totalImagesProcessed = 0;
    let successfulMigrations = 0;
    let failedMigrations = 0;

    // Process each product
    for (let i = 0; i < productsWithOldImages.length; i++) {
      const product = productsWithOldImages[i] as any;
      console.log(
        `\n[${i + 1}/${productsWithOldImages.length}] Processing: ${product.name}`,
      );
      console.log(`📷 Images to migrate: ${product.images.length}`);

      const newImageUrls = [];

      // Migrate each image
      for (const oldImageUrl of product.images) {
        totalImagesProcessed++;

        if (!oldImageUrl.includes('dsufx8uzd')) {
          // Skip if already using new cloud or different source
          newImageUrls.push(oldImageUrl);
          continue;
        }

        try {
          console.log(`   ⏳ Migrating image ${totalImagesProcessed}...`);

          // Download image from old cloud
          const response = await fetch(oldImageUrl);
          if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
          }

          const imageBuffer = Buffer.from(await response.arrayBuffer());

          // Upload to new cloud
          const uploadResult = await new Promise<any>((resolve, reject) => {
            newCloudinary.uploader
              .upload_stream(
                {
                  folder: 'ecommerce', // Use same folder structure
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

          newImageUrls.push(uploadResult.secure_url);
          successfulMigrations++;
          console.log(`   ✅ Success: ${uploadResult.secure_url}`);
        } catch (error) {
          console.log(`   ❌ Failed: ${error.message}`);
          failedMigrations++;
          // Keep old URL if migration fails
          newImageUrls.push(oldImageUrl);
        }

        // Add small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Update product with new image URLs
      try {
        await productsService.update(product._id.toString(), {
          images: newImageUrls,
        });
        console.log(`   💾 Updated product database`);
      } catch (error) {
        console.log(`   ❌ Database update failed: ${error.message}`);
      }

      // Progress update every 10 products
      if ((i + 1) % 10 === 0) {
        console.log(
          `\n📊 Progress: ${i + 1}/${productsWithOldImages.length} products processed`,
        );
        console.log(
          `✅ Successful: ${successfulMigrations}, ❌ Failed: ${failedMigrations}`,
        );
      }
    }

    // Final summary
    console.log('\n🎉 Migration Complete!');
    console.log('===============================');
    console.log(`📦 Products processed: ${productsWithOldImages.length}`);
    console.log(`📷 Total images: ${totalImagesProcessed}`);
    console.log(`✅ Successful migrations: ${successfulMigrations}`);
    console.log(`❌ Failed migrations: ${failedMigrations}`);
    console.log(
      `📊 Success rate: ${((successfulMigrations / totalImagesProcessed) * 100).toFixed(1)}%`,
    );
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await app.close();
  }
}

// Run migration
migrateCloudinaryImages()
  .then(() => {
    console.log('\n🏁 Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
