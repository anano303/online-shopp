import { Module, OnModuleInit } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controller/products.controller';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { AppService } from '@/app/services/app.service';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderSchema } from '@/orders/schemas/order.schema';
import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';

// Add a provider to manually drop the problematic index on module initialization
export class IndexCleanupService implements OnModuleInit {
  private readonly logger = new Logger('IndexCleanupService');

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Checking for and removing problematic indexes...');
      const collection = this.productModel.collection;
      const indexInfo = await collection.indexInformation();

      // Log found indexes
      this.logger.log(
        `Found indexes: ${JSON.stringify(Object.keys(indexInfo))}`,
      );

      // Look for any index on both sizes and ageGroups
      for (const indexName of Object.keys(indexInfo)) {
        if (indexName !== '_id_') {
          // Skip the default _id index
          const indexKeys = indexInfo[indexName];
          const indexFields = indexKeys.map((pair) => pair[0]);

          this.logger.log(
            `Index ${indexName} has fields: ${indexFields.join(', ')}`,
          );

          // If this index contains both sizes and ageGroups, drop it
          if (
            (indexFields.includes('ageGroups') &&
              indexFields.includes('sizes')) ||
            (indexFields.includes('ageGroups') &&
              indexFields.includes('colors')) ||
            (indexFields.includes('sizes') && indexFields.includes('colors'))
          ) {
            this.logger.warn(
              `Dropping problematic parallel array index: ${indexName}`,
            );
            await collection.dropIndex(indexName);
            this.logger.log(`Successfully dropped index: ${indexName}`);
          }
        }
      }

      this.logger.log('Index cleanup completed');
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('ns does not exist')
      ) {
        this.logger.log(
          'Collection does not exist yet, skipping index cleanup',
        );
      } else {
        this.logger.error('Error during index cleanup:', error);
      }
    }
  }
}

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Product.name,
        useFactory: () => {
          const schema = ProductSchema;

          // Remove any compound indexes on array fields
          schema.index({ mainCategory: 1 });
          schema.index({ subCategory: 1 });
          schema.index({ createdAt: -1 });

          // Make sure we don't have any compound indexes on multiple array fields
          // By explicitly removing them - this will ensure they don't get recreated

          return schema;
        },
      },
      {
        name: Order.name,
        useFactory: () => OrderSchema,
      },
    ]),
    CloudinaryModule,
  ],
  providers: [ProductsService, AppService, IndexCleanupService],
  controllers: [ProductsController],
  exports: [
    ProductsService,
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]), // Export the ProductModel to be available for other modules
  ],
})
export class ProductsModule {}
