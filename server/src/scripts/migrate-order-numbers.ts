import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderNumberCounter,
  OrderNumberCounterDocument,
} from '../orders/schemas/order.schema';

const ORDER_NUMBER_PREFIX = 'SHOP';
const ORDER_NUMBER_PAD_LENGTH = 5;
const ORDER_NUMBER_REGEX = new RegExp(
  `^${ORDER_NUMBER_PREFIX}\\d{${ORDER_NUMBER_PAD_LENGTH}}$`,
);

const formatOrderNumber = (sequence: number) =>
  `${ORDER_NUMBER_PREFIX}${sequence
    .toString()
    .padStart(ORDER_NUMBER_PAD_LENGTH, '0')}`;

const extractSequence = (value: unknown): number => {
  if (value === undefined || value === null) {
    return 0;
  }

  const asString =
    typeof value === 'string' || typeof value === 'number'
      ? value.toString()
      : '';

  if (!asString) {
    return 0;
  }

  const numericPart = asString.replace(/[^0-9]/g, '');
  return numericPart ? parseInt(numericPart, 10) : 0;
};

const shouldUpdateOrderNumber = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '') {
    return true;
  }

  if (typeof value === 'string') {
    return !ORDER_NUMBER_REGEX.test(value);
  }

  return true; // e.g. legacy numeric values
};

async function migrateOrderNumbers() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const orderModel = app.get<Model<OrderDocument>>(getModelToken(Order.name));
    const counterModel = app.get<Model<OrderNumberCounterDocument>>(
      getModelToken(OrderNumberCounter.name),
    );

    const counterDoc = await counterModel
      .findOne({ key: 'order-number' })
      .lean();

    const latestFormattedOrder = await orderModel
      .findOne({ orderNumber: { $type: 'string', $regex: ORDER_NUMBER_REGEX } })
      .sort({ orderNumber: -1 })
      .lean();

    const highestExistingSequence = extractSequence(
      latestFormattedOrder?.orderNumber,
    );

    let currentSequence = Math.max(
      counterDoc?.value ?? 0,
      highestExistingSequence,
    );

    const cursor = orderModel.find().sort({ createdAt: 1 }).cursor();

    let updatedCount = 0;

    for await (const order of cursor) {
      if (!shouldUpdateOrderNumber(order.orderNumber)) {
        continue;
      }

      currentSequence += 1;
      const formattedNumber = formatOrderNumber(currentSequence);

      await orderModel.updateOne(
        { _id: order._id },
        { $set: { orderNumber: formattedNumber } },
      );

      updatedCount += 1;

      if (updatedCount % 100 === 0) {
        console.log(`✅ Updated ${updatedCount} orders so far...`);
      }
    }

    await counterModel.findOneAndUpdate(
      { key: 'order-number' },
      { $set: { value: currentSequence } },
      { upsert: true, setDefaultsOnInsert: true },
    );

    console.log(
      `\n🎉 Migration complete! ${updatedCount} orders now have SSBB-prefixed numbers. Current counter value: ${currentSequence}.`,
    );
  } catch (error) {
    console.error('❌ Failed to migrate order numbers:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

migrateOrderNumbers();
