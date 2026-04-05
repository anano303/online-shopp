import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Product,
  ProductDocument,
  DeliveryType,
} from '../products/schemas/product.schema';

async function fixDeliveryType() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const productModel = app.get<Model<ProductDocument>>(
      getModelToken(Product.name),
    );

    const { matchedCount, modifiedCount } = await productModel.updateMany(
      { deliveryType: { $nin: [DeliveryType.SELLER, DeliveryType.store] } },
      { $set: { deliveryType: DeliveryType.store } },
    );

    console.log(
      `✅ Normalization complete. Matched ${matchedCount} products, updated ${modifiedCount}.`,
    );
  } catch (error) {
    console.error('❌ Failed to normalize delivery types:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

fixDeliveryType();
