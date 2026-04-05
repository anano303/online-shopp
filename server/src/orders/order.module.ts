import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './controller/orders.controller';
import {
  Order,
  OrderSchema,
  OrderNumberCounter,
  OrderNumberCounterSchema,
} from './schemas/order.schema';
import { OrdersService } from './services/orders.service';
import { StockReservationService } from './services/stock-reservation.service';
import { ProductsModule } from '@/products/products.module';
import { EmailModule } from '@/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: OrderNumberCounter.name,
        schema: OrderNumberCounterSchema,
      },
    ]),
    ProductsModule, // This will make the Product model available in the OrdersService
    EmailModule, // This will make the EmailService available in the OrdersService
  ],
  controllers: [OrdersController],
  providers: [OrdersService, StockReservationService],
  exports: [OrdersService, StockReservationService],
})
export class OrderModule {}
