import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { PaymentResult } from 'src/interfaces';
import {
  Order,
  OrderDocument,
  OrderNumberCounter,
} from '../schemas/order.schema';
import { Product } from '../../products/schemas/product.schema';
import { ProductsService } from '@/products/services/products.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EmailService } from '@/email/services/email.services';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private static readonly ORDER_NUMBER_PREFIX = 'SSBB';
  private static readonly ORDER_NUMBER_PAD_LENGTH = 5;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(OrderNumberCounter.name)
    private orderNumberCounterModel: Model<OrderNumberCounter>,
    private productsService: ProductsService,
    @InjectConnection() private connection: Connection,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  private async generateOrderNumber(session: ClientSession): Promise<string> {
    const counter = await this.orderNumberCounterModel.findOneAndUpdate(
      { key: 'order-number' },
      { $inc: { value: 1 } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        session,
      },
    );

    const sequence = counter.value;
    return `${OrdersService.ORDER_NUMBER_PREFIX}${sequence
      .toString()
      .padStart(OrdersService.ORDER_NUMBER_PAD_LENGTH, '0')}`;
  }

  private normalizeOrderNumber(search?: string): string | null {
    if (!search) {
      return null;
    }

    let value = search.trim();
    if (!value) {
      return null;
    }

    value = value.replace(/^#/, '').toUpperCase();

    if (!value) {
      return null;
    }

    if (value.startsWith(OrdersService.ORDER_NUMBER_PREFIX)) {
      const numericPart = value
        .slice(OrdersService.ORDER_NUMBER_PREFIX.length)
        .replace(/[^0-9]/g, '');

      if (!numericPart) {
        return null;
      }

      return `${OrdersService.ORDER_NUMBER_PREFIX}${numericPart.padStart(
        OrdersService.ORDER_NUMBER_PAD_LENGTH,
        '0',
      )}`;
    }

    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (!digitsOnly) {
      return null;
    }

    return `${OrdersService.ORDER_NUMBER_PREFIX}${digitsOnly.padStart(
      OrdersService.ORDER_NUMBER_PAD_LENGTH,
      '0',
    )}`;
  }

  async create(
    orderAttrs: Partial<Order>,
    userId: string,
    externalOrderId?: string,
  ): Promise<OrderDocument> {
    const {
      orderItems,
      shippingDetails,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = orderAttrs;

    if (orderItems && orderItems.length < 1)
      throw new BadRequestException('No order items received.');

    // Check for duplicate orders - same user, same total, within last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existingOrder = await this.orderModel.findOne({
      user: userId,
      totalPrice,
      createdAt: { $gte: twoMinutesAgo },
    });

    if (existingOrder) {
      this.logger.warn(
        `Duplicate order detected for user ${userId}. Returning existing order ${existingOrder.orderNumber}`,
      );
      return existingOrder;
    }

    // Start MongoDB transaction to prevent race conditions
    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        // First, validate and reserve stock for all items ATOMICALLY
        for (const item of orderItems) {
          const product = await this.productModel
            .findById(item.productId)
            .session(session);
          if (!product) {
            throw new NotFoundException(
              `Product with ID ${item.productId} not found`,
            );
          }

          // Track variant index for stock notification
          let variantIndex = -1;

          // Check and reserve stock atomically
          if (product.variants && product.variants.length > 0) {
            // Find the specific variant with flexible matching
            variantIndex = product.variants.findIndex((v) => {
              // Match size: if no size specified, variant shouldn't have size either
              const sizeMatch = !item.size ? !v.size : v.size === item.size;
              // Match color: if no color specified, variant shouldn't have color either
              const colorMatch = !item.color
                ? !v.color
                : v.color === item.color;
              // Match ageGroup: if no ageGroup specified, variant shouldn't have ageGroup either
              const ageGroupMatch = !item.ageGroup
                ? !v.ageGroup
                : v.ageGroup === item.ageGroup;

              return sizeMatch && colorMatch && ageGroupMatch;
            });

            if (variantIndex === -1) {
              // If variant not found but product has variants, fall back to general stock
              console.warn(
                `Variant not found for product ${product.name} (${item.size}/${item.color}/${item.ageGroup}), using general stock`,
              );

              if (product.countInStock < item.qty) {
                throw new BadRequestException(
                  `Not enough stock for product ${product.name}. Available: ${product.countInStock}, Requested: ${item.qty}`,
                );
              }
              product.countInStock -= item.qty;
            } else {
              if (product.variants[variantIndex].stock < item.qty) {
                throw new BadRequestException(
                  `Not enough stock for product ${product.name} variant (${item.size}/${item.color}/${item.ageGroup}). Available: ${product.variants[variantIndex].stock}, Requested: ${item.qty}`,
                );
              }

              // Reserve stock immediately (subtract from available stock)
              product.variants[variantIndex].stock -= item.qty;

              // Also update countInStock to reflect total available stock from all variants
              product.countInStock = product.variants.reduce(
                (total, variant) => total + variant.stock,
                0,
              );
            }
          } else {
            // Handle legacy products without variants
            if (product.countInStock < item.qty) {
              throw new BadRequestException(
                `Not enough stock for product ${product.name}. Available: ${product.countInStock}, Requested: ${item.qty}`,
              );
            }

            // Reserve stock immediately
            product.countInStock -= item.qty;
          }

          // Save the product with updated stock within the transaction
          await product.save({ session });

          // Check if stock is depleted and notify admin
          if (product.countInStock <= 0) {
            // Send notification asynchronously (don't block order creation)
            this.emailService
              .sendOutOfStockNotificationEmail({
                productName: product.name,
                productId: product._id.toString(),
                currentStock: product.countInStock,
              })
              .catch((err) =>
                console.error('Failed to send out of stock notification:', err),
              );
          }

          // Also check individual variant stock
          if (
            product.variants &&
            product.variants.length > 0 &&
            variantIndex !== -1
          ) {
            const variant = product.variants[variantIndex];
            if (variant.stock <= 0) {
              const variantInfo = [
                variant.size ? `ზომა: ${variant.size}` : '',
                variant.color ? `ფერი: ${variant.color}` : '',
                variant.ageGroup ? `ასაკი: ${variant.ageGroup}` : '',
              ]
                .filter(Boolean)
                .join(', ');

              this.emailService
                .sendOutOfStockNotificationEmail({
                  productName: product.name,
                  productId: product._id.toString(),
                  currentStock: variant.stock,
                  variantInfo,
                })
                .catch((err) =>
                  console.error(
                    'Failed to send out of stock notification for variant:',
                    err,
                  ),
                );
            }
          }
        }

        // Now create the order (stock is already reserved)
        const enhancedOrderItems = await Promise.all(
          orderItems.map(async (item) => {
            const product = await this.productModel
              .findById(item.productId)
              .session(session);
            if (!product) {
              throw new NotFoundException(
                `Product with ID ${item.productId} not found`,
              );
            }

            return {
              ...item,
              // Ensure size, color, and ageGroup are included from the order item
              size: item.size || '',
              color: item.color || '',
              ageGroup: item.ageGroup || '',
              product: {
                _id: product._id,
                name: product.name,
                nameEn: product.nameEn,
                deliveryType: product.deliveryType,
                minDeliveryDays: product.minDeliveryDays,
                maxDeliveryDays: product.maxDeliveryDays,
                dimensions: product.dimensions
                  ? {
                      width: product.dimensions.width,
                      height: product.dimensions.height,
                      depth: product.dimensions.depth,
                    }
                  : undefined,
              },
            };
          }),
        );

        const orderNumber = await this.generateOrderNumber(session);

        const createdOrder = await this.orderModel.create(
          [
            {
              user: userId,
              orderItems: enhancedOrderItems,
              shippingDetails,
              paymentMethod,
              itemsPrice,
              taxPrice,
              shippingPrice,
              totalPrice,
              externalOrderId,
              orderNumber,
              stockReservationExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
            },
          ],
          { session },
        );

        return createdOrder[0];
      });
    } finally {
      await session.endSession();
    }
  }

  async findAll(orderNumber?: string): Promise<OrderDocument[]> {
    const filter: Record<string, unknown> = {};

    if (orderNumber) {
      const normalized = this.normalizeOrderNumber(orderNumber);
      if (!normalized) {
        return [];
      }
      filter['orderNumber'] = normalized;
    }

    const orders = await this.orderModel
      .find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return orders;
  }

  async findById(id: string): Promise<OrderDocument> {
    let query: Record<string, unknown> | null = null;

    if (Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      const normalized = this.normalizeOrderNumber(id);
      if (normalized) {
        query = { orderNumber: normalized };
      }
    }

    if (!query) {
      throw new BadRequestException('Invalid order identifier.');
    }

    const order = await this.orderModel
      .findOne(query)
      .populate('user', 'name email firstName lastName');

    if (!order) throw new NotFoundException('No order with given ID.');

    return order;
  }
  async updatePaid(
    id: string,
    paymentResult: PaymentResult,
  ): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid order ID.');

    const order = await this.orderModel.findById(id);

    if (!order) throw new NotFoundException('No order with given ID.');

    // Check if order is already paid
    if (order.isPaid) {
      throw new BadRequestException('Order is already paid.');
    }

    // შეამოწმოს თუ შეკვეთა cancelled სტატუსშია, მაშინ არ დაუშვას გადახდა
    if (order.status === 'cancelled') {
      throw new BadRequestException(
        'Cannot pay for cancelled order. Please create a new order.',
      );
    }

    // თუ სტოკის რეზერვაცია ამოიწურა, მაგრამ გადახდა მოდის, პირდაპირ შევცვალოთ სტატუსი
    // ეს ხდება იმ შემთხვევაში თუ მომხმარებელმა წარმატებით გადაიხადა საბანკო სისტემაში
    const isExpired =
      order.stockReservationExpires &&
      new Date() > order.stockReservationExpires;

    if (isExpired) {
      // თუ რეზერვაცია ამოიწურა, მაგრამ გადახდა მოვიდა, მაინც შევცვალოთ სტატუსი გადახდილში
      this.logger?.log(
        `Payment received for expired reservation order ${id}. Processing payment anyway.`,
      );
    }

    // შევამოწმოთ სტოკი მხოლოდ იმ შემთხვევაში თუ რეზერვაცია არ ამოიწურა
    if (!isExpired) {
      // Validate that stock is still available for all order items
      for (const item of order.orderItems) {
        const product = await this.productModel.findById(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Product ${item.name} is no longer available.`,
          );
        }

        // Check stock availability
        let stockAvailable = false;

        if (product.variants && product.variants.length > 0) {
          // Check variant stock with flexible matching
          const variant = product.variants.find((v) => {
            const sizeMatch = !item.size ? !v.size : v.size === item.size;
            const colorMatch = !item.color ? !v.color : v.color === item.color;
            const ageGroupMatch = !item.ageGroup
              ? !v.ageGroup
              : v.ageGroup === item.ageGroup;
            return sizeMatch && colorMatch && ageGroupMatch;
          });

          if (variant && variant.stock >= 0) {
            stockAvailable = true;
          }
        } else {
          // Check general stock
          if (product.countInStock >= 0) {
            stockAvailable = true;
          }
        }

        if (!stockAvailable) {
          throw new BadRequestException(
            `Product "${item.name}" ${item.size ? `(${item.size}/${item.color}/${item.ageGroup})` : ''} is no longer available. Stock has been exhausted.`,
          );
        }
      }
    }

    order.isPaid = true;
    order.paidAt = Date();
    order.paymentResult = paymentResult;
    order.status = 'paid'; // Update status to paid

    // Remove stock reservation expiration since payment is completed
    order.stockReservationExpires = undefined;

    // Note: Stock is already reduced during order creation
    // No need to reduce stock again here to prevent double reduction

    const updatedOrder = await order.save();
    return updatedOrder;
  }

  async updateDelivered(id: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid order ID.');

    const order = await this.orderModel
      .findById(id)
      .populate('user', 'name email');

    if (!order) throw new NotFoundException('No order with given ID.');

    order.isDelivered = true;
    order.deliveredAt = Date();
    order.status = 'delivered'; // Update status to delivered

    const updatedOrder = await order.save();

    // Send delivery confirmation email with review request
    try {
      await this.sendDeliveryConfirmationEmail(updatedOrder);
      console.log(`✅ Delivery confirmation email sent for order ${id}`);
    } catch (emailError: any) {
      console.error(
        '❌ Failed to send delivery confirmation email:',
        emailError.message,
      );
      // Don't throw - delivery is confirmed, email failure shouldn't block
    }

    return updatedOrder;
  }

  /**
   * Send delivery confirmation email with review request to customer
   */
  private async sendDeliveryConfirmationEmail(order: any) {
    const user = order.user;
    if (!user || !user.email) {
      console.log('No user email found for delivery confirmation');
      return;
    }

    const orderNumber =
      order.orderNumber || order.externalOrderId || order._id.toString();
    const customerName = user.name || user.firstName || 'მომხმარებელო';

    const orderItems = order.orderItems.map((item: any) => ({
      name: item.name,
      productId: item.product?.toString() || item.productId || '',
      image: item.image,
    }));

    await this.emailService.sendDeliveryConfirmationEmail({
      customerEmail: user.email,
      customerName,
      orderNumber,
      orderItems,
    });
  }

  async findUserOrders(userId: string) {
    // Sort by createdAt in descending order (newest first)
    const orders = await this.orderModel
      .find({ user: userId })
      .sort({ createdAt: -1 });

    return orders;
  }

  async findByExternalOrderId(externalOrderId: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne({ externalOrderId })
      .populate('user', 'name email firstName lastName');

    if (!order) {
      throw new NotFoundException(
        `Order with external ID ${externalOrderId} not found`,
      );
    }

    return order;
  }

  async updateOrderByExternalId(
    externalOrderId: string,
    paymentResult: PaymentResult,
  ): Promise<OrderDocument> {
    console.log(`Updating order by external ID: ${externalOrderId}`);
    console.log('Payment result:', JSON.stringify(paymentResult, null, 2));

    const order = await this.orderModel.findOne({ externalOrderId });

    if (!order) {
      console.log(`Order with external ID ${externalOrderId} not found`);
      throw new NotFoundException(
        `Order with external ID ${externalOrderId} not found`,
      );
    }

    console.log(
      `Found order: ${order._id}, current isPaid: ${order.isPaid}, current status: ${order.status}`,
    );

    // Check if order is already paid
    if (order.isPaid) {
      console.log('Order is already paid, skipping update');
      throw new BadRequestException('Order is already paid.');
    }

    // IMPORTANT: If payment is received, accept it regardless of order status
    // Even if the order was cancelled due to expired stock reservation,
    // we should accept the payment since the customer already paid
    if (order.status === 'cancelled') {
      this.logger.log(
        `Payment received for cancelled order ${externalOrderId}. Accepting payment and reactivating order.`,
      );
    }

    // Check if stock reservation has expired
    const isExpired =
      order.stockReservationExpires &&
      new Date() > order.stockReservationExpires;

    if (isExpired) {
      this.logger.log(
        `Payment received for expired reservation order ${externalOrderId}. Processing payment anyway.`,
      );
    }

    // Check if order was cancelled - in this case, stock was already refunded
    // We need to re-reserve the stock
    const wasCancelled = order.status === 'cancelled';

    if (wasCancelled) {
      this.logger.log(
        `Order ${externalOrderId} was cancelled, re-reserving stock...`,
      );

      // Re-reserve stock for cancelled orders that received payment
      const session = await this.connection.startSession();
      try {
        await session.withTransaction(async () => {
          for (const item of order.orderItems) {
            const product = await this.productModel
              .findById(item.productId)
              .session(session);

            if (!product) {
              throw new NotFoundException(
                `Product ${item.name} is no longer available.`,
              );
            }

            // Re-deduct stock
            if (product.variants && product.variants.length > 0) {
              const variantIndex = product.variants.findIndex((v) => {
                const sizeMatch = !item.size ? !v.size : v.size === item.size;
                const colorMatch = !item.color
                  ? !v.color
                  : v.color === item.color;
                const ageGroupMatch = !item.ageGroup
                  ? !v.ageGroup
                  : v.ageGroup === item.ageGroup;
                return sizeMatch && colorMatch && ageGroupMatch;
              });

              if (variantIndex === -1) {
                // No variant found, use general stock
                if (product.countInStock < item.qty) {
                  throw new BadRequestException(
                    `Not enough stock for product ${product.name}. Available: ${product.countInStock}, Requested: ${item.qty}`,
                  );
                }
                product.countInStock -= item.qty;
              } else {
                if (product.variants[variantIndex].stock < item.qty) {
                  throw new BadRequestException(
                    `Not enough stock for product ${product.name} variant. Available: ${product.variants[variantIndex].stock}, Requested: ${item.qty}`,
                  );
                }
                product.variants[variantIndex].stock -= item.qty;
                // Sync countInStock with variant sum
                product.countInStock = product.variants.reduce(
                  (total, variant) => total + variant.stock,
                  0,
                );
              }
            } else {
              if (product.countInStock < item.qty) {
                throw new BadRequestException(
                  `Not enough stock for product ${product.name}. Available: ${product.countInStock}, Requested: ${item.qty}`,
                );
              }
              product.countInStock -= item.qty;
            }

            await product.save({ session });
          }
        });
        await session.endSession();
        this.logger.log(`Stock re-reserved for order ${externalOrderId}`);
      } catch (error: any) {
        await session.endSession();
        this.logger.error(
          `Failed to re-reserve stock for order ${externalOrderId}:`,
          error.message,
        );
        throw error;
      }
    } else if (!isExpired) {
      // Validate that reserved stock is still valid (stock should be >= 0 after initial reservation)
      for (const item of order.orderItems) {
        const product = await this.productModel.findById(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Product ${item.name} is no longer available.`,
          );
        }

        // Check if stock went negative (shouldn't happen with our system, but safety check)
        let stockValid = false;

        if (product.variants && product.variants.length > 0) {
          const variant = product.variants.find((v) => {
            const sizeMatch = !item.size ? !v.size : v.size === item.size;
            const colorMatch = !item.color ? !v.color : v.color === item.color;
            const ageGroupMatch = !item.ageGroup
              ? !v.ageGroup
              : v.ageGroup === item.ageGroup;
            return sizeMatch && colorMatch && ageGroupMatch;
          });

          if (variant && variant.stock >= 0) {
            stockValid = true;
          }
        } else {
          if (product.countInStock >= 0) {
            stockValid = true;
          }
        }

        if (!stockValid) {
          throw new BadRequestException(
            `Product "${item.name}" stock integrity issue.`,
          );
        }
      }
    }

    console.log('Setting order as paid');
    order.isPaid = true;
    order.paidAt = new Date().toISOString();
    order.paymentResult = paymentResult;
    order.status = 'paid'; // Update status to paid

    // Remove stock reservation expiration since payment is completed
    order.stockReservationExpires = undefined;

    // Note: Stock is already reduced during order creation
    // No need to reduce stock again here to prevent double reduction

    console.log('Saving updated order...');
    const updatedOrder = await order.save();
    console.log(
      `Order ${externalOrderId} successfully updated. New isPaid: ${updatedOrder.isPaid}, new status: ${updatedOrder.status}`,
    );

    // Send email notifications after successful payment
    try {
      console.log('🚀 SENDING EMAIL NOTIFICATIONS FOR PAID ORDER...');
      const orderWithUser = await this.orderModel
        .findById(updatedOrder._id)
        .populate('user', 'name email firstName lastName');

      if (orderWithUser) {
        // Send customer confirmation email
        await this.sendOrderConfirmationEmail(orderWithUser);
        console.log(
          `✅ Customer confirmation email sent for order ${externalOrderId}`,
        );

        // Send admin notification email
        await this.sendAdminNotificationEmail(orderWithUser);
        console.log(
          `✅ Admin notification email sent for order ${externalOrderId}`,
        );
      }
    } catch (emailError: any) {
      console.error(
        '❌ Failed to send email notifications:',
        emailError.message,
      );
      // Don't throw error - payment is successful, just log email failure
    }

    return updatedOrder;
  }

  /**
   * Refund stock if order is cancelled or payment fails
   */
  async refundStock(orderId: string): Promise<void> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        for (const item of order.orderItems) {
          const product = await this.productModel
            .findById(item.productId)
            .session(session);
          if (!product) {
            console.warn(
              `Product with ID ${item.productId} not found during stock refund`,
            );
            continue;
          }

          // Refund stock
          if (product.variants && product.variants.length > 0) {
            const variantIndex = product.variants.findIndex((v) => {
              const sizeMatch = !item.size ? !v.size : v.size === item.size;
              const colorMatch = !item.color
                ? !v.color
                : v.color === item.color;
              const ageGroupMatch = !item.ageGroup
                ? !v.ageGroup
                : v.ageGroup === item.ageGroup;
              return sizeMatch && colorMatch && ageGroupMatch;
            });

            if (variantIndex >= 0) {
              product.variants[variantIndex].stock += item.qty;
            }
            // Update countInStock to match total variant stock
            product.countInStock = product.variants.reduce(
              (total, variant) => total + variant.stock,
              0,
            );
          } else {
            product.countInStock += item.qty;
          }

          await product.save({ session });
        }
      });
    } finally {
      await session.endSession();
    }
  }

  async cancelOrder(id: string, reason?: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid order ID.');

    const order = await this.orderModel.findById(id);

    if (!order) throw new NotFoundException('No order with given ID.');

    // Check if order is already cancelled
    if (order.status === 'cancelled') {
      throw new BadRequestException('Order is already cancelled.');
    }

    // Check if order is already paid - paid orders cannot be cancelled automatically
    if (order.isPaid) {
      throw new BadRequestException(
        'Cannot cancel paid order automatically. Please contact support.',
      );
    }

    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        // Refund stock for the order
        await this.refundStockForOrder(order, session);

        // Mark order as cancelled
        order.set('status', 'cancelled');
        order.set('statusReason', reason || 'Manually cancelled');
        order.set('cancelledAt', new Date());
        order.set('stockReservationExpires', undefined); // Remove expiration since it's cancelled

        const updatedOrder = await order.save({ session });
        return updatedOrder;
      });
    } finally {
      await session.endSession();
    }
  }

  async findUserOrdersByStatus(userId: string, status?: string) {
    const query: any = { user: userId };

    if (status) {
      query.status = status;
    }

    // Sort by createdAt in descending order (newest first)
    const orders = await this.orderModel.find(query).sort({ createdAt: -1 });

    return orders;
  }

  /**
   * Refund stock for a specific order - with safety checks
   * This method is used by the stock reservation service and manual cancellation
   */
  private async refundStockForOrder(order: OrderDocument, session: any) {
    // Ensure order is in a state where stock refund is appropriate
    if (order.isPaid || order.status === 'cancelled') {
      this.logger.warn(
        `Attempted to refund stock for order ${order._id} but it's already paid or cancelled`,
      );
      return;
    }

    for (const item of order.orderItems) {
      const product = await this.productModel
        .findById(item.productId)
        .session(session);

      if (!product) {
        this.logger.warn(
          `Product with ID ${item.productId} not found during stock refund for order ${order._id}`,
        );
        continue;
      }

      // Refund stock
      if (product.variants && product.variants.length > 0) {
        const variantIndex = product.variants.findIndex((v) => {
          const sizeMatch = !item.size ? !v.size : v.size === item.size;
          const colorMatch = !item.color ? !v.color : v.color === item.color;
          const ageGroupMatch = !item.ageGroup
            ? !v.ageGroup
            : v.ageGroup === item.ageGroup;
          return sizeMatch && colorMatch && ageGroupMatch;
        });

        if (variantIndex >= 0) {
          product.variants[variantIndex].stock += item.qty;
        }
        // Update countInStock to match total variant stock
        product.countInStock = product.variants.reduce(
          (total, variant) => total + variant.stock,
          0,
        );
      } else {
        product.countInStock += item.qty;
      }

      await product.save({ session });
    }
  }

  /**
   * Send order confirmation email to customer
   */
  private async sendOrderConfirmationEmail(order: any) {
    try {
      const orderDisplayId = this.getOrderDisplayId(order);
      const orderLink = this.buildOrderLink(order);

      const orderData = {
        customerEmail: order.user?.email || order.shippingDetails?.email || '',
        orderId: orderDisplayId || order._id?.toString() || '',
        displayOrderId: orderDisplayId,
        orderLink,
        customerName:
          order.user?.name ||
          `${order.shippingDetails?.firstName || ''} ${order.shippingDetails?.lastName || ''}`.trim() ||
          'Customer',
        items:
          order.orderItems?.map((item: any) => ({
            name: item.name,
            quantity: item.qty,
            price: item.price,
            size: item.size,
            color: item.color,
            ageGroup: item.ageGroup,
          })) || [],
        totalAmount: order.totalPrice || 0,
        shippingAddress: {
          firstName: order.shippingDetails?.firstName || '',
          lastName: order.shippingDetails?.lastName || '',
          address: order.shippingDetails?.address || '',
          city: order.shippingDetails?.city || '',
          postalCode: order.shippingDetails?.postalCode,
          phoneNumber: order.shippingDetails?.phoneNumber || '',
        },
        paymentMethod: order.paymentMethod || 'BOG',
        orderDate: new Date(order.createdAt || Date.now()).toLocaleDateString(
          'ka-GE',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          },
        ),
      };

      // Only send email if we have customer email
      if (orderData.customerEmail) {
        await this.emailService.sendOrderConfirmationEmail(orderData);
        console.log(
          `✅ Order confirmation email sent to ${orderData.customerEmail}`,
        );
      } else {
        console.log('⚠️ No customer email found for order:', order._id);
      }
    } catch (error: any) {
      console.error(
        '❌ Error preparing order confirmation email:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Send admin notification email
   */
  private async sendAdminNotificationEmail(order: any) {
    try {
      const orderDisplayId = this.getOrderDisplayId(order);
      const orderLink = this.buildOrderLink(order);

      const orderData = {
        orderId: orderDisplayId || order._id?.toString() || '',
        displayOrderId: orderDisplayId,
        orderLink,
        customerName:
          order.user?.name ||
          `${order.shippingDetails?.firstName || ''} ${order.shippingDetails?.lastName || ''}`.trim() ||
          'Customer',
        customerEmail:
          order.user?.email || order.shippingDetails?.email || 'N/A',
        customerPhone: order.shippingDetails?.phoneNumber || 'N/A',
        items:
          order.orderItems?.map((item: any) => ({
            name: item.name,
            quantity: item.qty,
            price: item.price,
            size: item.size,
            color: item.color,
            ageGroup: item.ageGroup,
          })) || [],
        totalAmount: order.totalPrice || 0,
        shippingAddress: {
          firstName: order.shippingDetails?.firstName || '',
          lastName: order.shippingDetails?.lastName || '',
          address: order.shippingDetails?.address || '',
          city: order.shippingDetails?.city || '',
          postalCode: order.shippingDetails?.postalCode,
          phoneNumber: order.shippingDetails?.phoneNumber || '',
        },
        paymentMethod: order.paymentMethod || 'BOG',
        orderDate: new Date(order.createdAt || Date.now()).toLocaleDateString(
          'ka-GE',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          },
        ),
      };

      await this.emailService.sendAdminOrderNotification(orderData);
      console.log(`✅ Admin notification email sent for order ${order._id}`);
    } catch (error: any) {
      console.error(
        '❌ Error preparing admin notification email:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Check payment status from BOG and sync with order
   * This is used when callback doesn't arrive
   */
  async checkAndSyncPaymentStatus(orderId: string): Promise<{
    success: boolean;
    message: string;
    order?: OrderDocument;
  }> {
    try {
      // Find order by friendly identifier or ObjectId
      const order = await this.findById(orderId);

      // If already paid, return success
      if (order.isPaid) {
        this.logger.log(`Order ${orderId} is already paid`);
        return {
          success: true,
          message: 'Order is already paid',
          order,
        };
      }

      // Check if order has externalOrderId (BOG order ID)
      if (!order.externalOrderId) {
        this.logger.log(`Order ${orderId} has no BOG payment initiated`);
        return {
          success: false,
          message: 'No payment initiated for this order',
          order,
        };
      }

      this.logger.log(
        `Checking BOG payment status for order ${orderId}, external ID: ${order.externalOrderId}, BOG order ID: ${order.bogOrderId || 'not set'}`,
      );

      // If we have BOG's order_id, we can query their API
      if (order.bogOrderId) {
        try {
          // Get BOG access token
          const token = await this.getBogToken();

          // Check payment status from BOG using their order_id
          const paymentStatus = await this.checkBogPaymentStatus(
            order.bogOrderId,
            token,
          );

          this.logger.log(
            `BOG payment status for ${order.bogOrderId}: ${paymentStatus.status}`,
          );

          // If payment is completed, update order
          if (paymentStatus.status === 'completed') {
            const paymentResult: PaymentResult = {
              id: order.externalOrderId,
              status: paymentStatus.status,
              update_time: new Date().toISOString(),
              email_address:
                order.user?.email || order.shippingDetails?.email || 'unknown',
            };

            const updatedOrder = await this.updateOrderByExternalId(
              order.externalOrderId,
              paymentResult,
            );

            return {
              success: true,
              message: 'Payment confirmed and order updated',
              order: updatedOrder,
            };
          }

          // Payment not completed yet
          return {
            success: false,
            message: `Payment status: ${paymentStatus.status}`,
            order,
          };
        } catch (error: any) {
          this.logger.error(`Error querying BOG API: ${error.message}`);
          // Fall through to return unable to verify message
        }
      }

      // Note: We can't query BOG API without bogOrderId
      this.logger.warn(
        'Cannot query BOG API - bogOrderId not stored (order created before this feature was added)',
      );

      return {
        success: false,
        message:
          'Cannot verify payment - BOG order_id not stored. If payment was completed, BOG will send a callback automatically.',
        order,
      };
    } catch (error: any) {
      this.logger.error(
        `Error checking payment status for order ${orderId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get BOG access token
   */
  private async getBogToken(): Promise<string> {
    try {
      const clientId = this.configService.get<string>('BOG_CLIENT_ID');
      const clientSecret = this.configService.get<string>('BOG_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new Error('BOG credentials are not configured');
      }

      const response = await axios.post(
        'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:
              'Basic ' +
              Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          },
        },
      );

      return response.data.access_token;
    } catch (error: any) {
      this.logger.error('BOG Token Error:', error.message);
      throw error;
    }
  }

  /**
   * Check BOG payment status
   */
  private async checkBogPaymentStatus(
    orderId: string,
    token: string,
  ): Promise<{ status: string }> {
    try {
      const response = await axios.get(
        `https://api.bog.ge/payments/v1/receipt/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        status: response.data.order_status?.key || 'unknown',
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { status: 'not_found' };
      }
      this.logger.error(
        `BOG Payment Status Error for ${orderId}:`,
        error.message,
      );
      throw error;
    }
  }

  private getOrderDisplayId(order: any): string {
    return (
      order?.orderNumber ||
      order?.externalOrderId ||
      order?._id?.toString() ||
      ''
    );
  }

  private getClientBaseUrl(): string {
    const origins = process.env.ALLOWED_ORIGINS;
    if (origins && origins.length > 0) {
      return origins.split(',')[0].trim();
    }
    return 'https://13.online.ge';
  }

  private buildOrderLink(order: any): string | undefined {
    const baseUrl = this.getClientBaseUrl();
    const orderIdentifier =
      typeof order === 'string'
        ? order
        : order?.orderNumber || order?._id?.toString();
    if (!baseUrl || !orderIdentifier) {
      return undefined;
    }
    const normalizedBase = baseUrl.endsWith('/')
      ? baseUrl.slice(0, -1)
      : baseUrl;
    return `${normalizedBase}/orders/${orderIdentifier}`;
  }
}
