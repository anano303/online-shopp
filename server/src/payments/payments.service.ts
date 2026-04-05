import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { OrdersService } from '../orders/services/orders.service';
import { EmailService } from '../email/services/email.services';

interface BogTokenResponse {
  access_token: string;
}

interface BogPaymentResponse {
  id: string;
  _links: {
    redirect: {
      href: string;
    };
  };
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly emailService: EmailService,
  ) {}

  private async getToken(): Promise<string> {
    try {
      const clientId = this.configService.get<string>('BOG_CLIENT_ID');
      const clientSecret = this.configService.get<string>('BOG_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new Error('BOG credentials are not configured');
      }

      const response = await axios.post<BogTokenResponse>(
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
      console.error('BOG Token Error:', error.message);
      throw error;
    }
  }

  async createPayment(data: {
    product: {
      quantity: number;
      unitPrice: number;
      productId: string;
      productName: string;
      totalPrice: number;
    };
    customer: {
      firstName: string;
      lastName: string;
      personalId: string;
      address: string;
      phoneNumber: string;
      email: string;
    };
    successUrl?: string;
    failUrl?: string;
  }) {
    try {
      const token = await this.getToken();
      const externalOrderId = uuidv4();

      let orderForRedirect: any = null;
      try {
        orderForRedirect = await this.ordersService.findById(
          data.product.productId,
        );
      } catch (error) {
        console.warn(
          '⚠️ Could not fetch order while preparing BOG payment redirect URLs:',
          (error as any).message,
        );
      }

      const friendlyOrderNumber =
        orderForRedirect?.orderNumber ||
        orderForRedirect?.externalOrderId ||
        orderForRedirect?._id?.toString() ||
        data.product.productId;
      const mongoId = orderForRedirect?._id?.toString() || null;
      const appendOrderParams = (
        url: string | undefined,
        defaultUrl: string,
      ): string => {
        const ensureStringUrl = url?.trim()?.length ? url : defaultUrl;

        try {
          const parsed = new URL(ensureStringUrl);
          if (friendlyOrderNumber) {
            parsed.searchParams.set('orderId', friendlyOrderNumber);
          }
          if (mongoId && friendlyOrderNumber !== mongoId) {
            parsed.searchParams.set('dbId', mongoId);
          }
          return parsed.toString();
        } catch {
          const separator = ensureStringUrl.includes('?') ? '&' : '?';
          const params = new URLSearchParams();
          if (friendlyOrderNumber) {
            params.set('orderId', friendlyOrderNumber);
          }
          if (mongoId && friendlyOrderNumber !== mongoId) {
            params.set('dbId', mongoId);
          }
          return `${ensureStringUrl}${separator}${params.toString()}`;
        }
      };

      const defaultSuccessUrl =
        data.successUrl || 'https://13.online.ge/checkout/success';
      const defaultFailUrl =
        data.failUrl || 'https://13.online.ge/checkout/fail';
      const successRedirectUrl = appendOrderParams(
        data.successUrl,
        defaultSuccessUrl,
      );
      const failRedirectUrl = appendOrderParams(data.failUrl, defaultFailUrl);

      // Fix floating-point precision issues for BOG API
      const unitPrice = parseFloat(data.product.unitPrice.toFixed(2));
      const totalPrice = parseFloat(data.product.totalPrice.toFixed(2));

      const basket = [
        {
          quantity: data.product.quantity,
          unit_price: unitPrice,
          product_id: data.product.productId,
          description: data.product.productName,
        },
      ];

      const payload = {
        callback_url: this.configService.get('BOG_CALLBACK_URL'),
        capture: 'automatic',
        external_order_id: externalOrderId,
        purchase_units: {
          currency: 'GEL',
          total_amount: totalPrice,
          basket,
        },
        payment_method: ['card'],
        ttl: 10,
        redirect_urls: {
          success: successRedirectUrl,
          fail: failRedirectUrl,
        },
      };

      const response = await axios.post<BogPaymentResponse>(
        'https://api.bog.ge/payments/v1/ecommerce/orders',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'Accept-Language': 'ka',
            'Idempotency-Key': uuidv4(),
          },
        },
      );

      return {
        order_id: response.data.id,
        redirect_url: response.data._links.redirect.href,
        token,
        uniqueId: externalOrderId,
      };
    } catch (error: any) {
      console.error('BOG Service Error:', error.message);
      throw error;
    }
  }

  async getPaymentStatus(orderId: string): Promise<any> {
    const token = await this.getToken();
    const response = await axios.get(
      `https://api.bog.ge/payments/v1/receipt/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  }

  async handlePaymentCallback(
    callbackData: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(
        'BOG Payment Callback received:',
        JSON.stringify(callbackData, null, 2),
      );

      const {
        external_order_id,
        order_status: { key: status },
        order_id,
      } = callbackData.body;

      if (!external_order_id && !order_id) {
        console.log('No order identifier found in callback data');
        return { success: false, message: 'No order identifier found' };
      }

      console.log(
        `Processing payment for external_order_id: ${external_order_id}, order_id: ${order_id}, status: ${status}`,
      );

      let paymentStatus;
      try {
        if (order_id) {
          console.log(`Fetching payment status for order_id: ${order_id}`);
          paymentStatus = await this.getPaymentStatus(order_id);
          console.log(
            'Payment status from BOG API:',
            JSON.stringify(paymentStatus, null, 2),
          );
        }
      } catch (error: any) {
        console.log(
          'Error fetching payment status from BOG API:',
          error.message,
        );
        paymentStatus = { status };
      }

      const isPaymentSuccessful =
        paymentStatus?.status === 'completed' || status === 'completed';

      console.log(
        `Payment successful: ${isPaymentSuccessful}, external_order_id: ${external_order_id}`,
      );

      if (isPaymentSuccessful && external_order_id) {
        try {
          const paymentResult = {
            id: order_id || external_order_id,
            status: paymentStatus?.status || status,
            update_time: new Date().toISOString(),
            email_address: paymentStatus?.email || 'unknown@unknown.com',
          };

          console.log(
            'Updating order with payment result:',
            JSON.stringify(paymentResult, null, 2),
          );

          await this.ordersService.updateOrderByExternalId(
            external_order_id,
            paymentResult,
          );

          console.log(
            `Order ${external_order_id} successfully updated with payment status`,
          );

          // Email notifications are sent in ordersService.updateOrderByExternalId
          // No need to send them here again

          return {
            success: true,
            message: 'Payment processed successfully and order updated',
          };
        } catch (error: any) {
          console.error(
            'Error updating order with payment result:',
            error.message,
          );
          return {
            success: false,
            message:
              'Payment successful but failed to update order: ' + error.message,
          };
        }
      } else {
        console.log(
          'Payment was not successful or external_order_id is missing',
        );
        return {
          success: false,
          message: 'Payment was not successful',
        };
      }
    } catch (error: any) {
      console.error('Error processing payment callback:', error.message);
      return {
        success: false,
        message: 'Error processing payment callback: ' + error.message,
      };
    }
  }

  async updateOrderWithExternalId(
    orderId: string,
    externalOrderId: string,
  ): Promise<void> {
    try {
      const order = await this.ordersService.findById(orderId);
      if (order) {
        order.externalOrderId = externalOrderId;
        await order.save();
      }
    } catch (error) {
      console.error('Error updating order with external ID:', error);
      throw error;
    }
  }

  async updateOrderWithBogIds(
    orderId: string,
    externalOrderId: string,
    bogOrderId: string,
  ): Promise<void> {
    try {
      const order = await this.ordersService.findById(orderId);
      if (order) {
        order.externalOrderId = externalOrderId;
        order.bogOrderId = bogOrderId;
        await order.save();
        const displayId = order.orderNumber || order.externalOrderId || orderId;
        console.log(
          `✅ Updated order ${displayId} (mongoId: ${orderId}) with externalOrderId: ${externalOrderId}, bogOrderId: ${bogOrderId}`,
        );
      }
    } catch (error) {
      console.error('Error updating order with BOG IDs:', error);
      throw error;
    }
  }

  async getOrderByExternalId(externalOrderId: string) {
    return this.ordersService.findByExternalOrderId(externalOrderId);
  }

  private async sendOrderConfirmationEmail(order: any) {
    try {
      // Prepare order data for email
      console.log('📧 Preparing customer email - Order data:', {
        user: order.user,
        hasUser: !!order.user,
        userEmail: order.user?.email,
        userName: order.user?.name,
      });

      const orderDisplayId =
        order.orderNumber || order.externalOrderId || order._id.toString();
      const orderLink = this.buildOrderLink(order);

      const orderData = {
        customerEmail: order.user?.email || null,
        orderId: orderDisplayId || order._id?.toString() || '',
        displayOrderId: orderDisplayId,
        orderLink,
        customerName: order.user?.name || 'Customer',
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
      } else {
        console.log('No customer email found for order:', order._id);
      }
    } catch (error: any) {
      console.error('Error preparing order confirmation email:', error.message);
      throw error;
    }
  }

  private async sendAdminNotificationEmail(order: any) {
    try {
      const orderDisplayId =
        order.orderNumber || order.externalOrderId || order._id.toString();
      const orderLink = this.buildOrderLink(order);

      const orderData = {
        orderId: orderDisplayId || order._id?.toString() || '',
        displayOrderId: orderDisplayId,
        orderLink,
        customerName: order.user?.name || 'Customer',
        customerEmail: order.user?.email || 'N/A',
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
    } catch (error: any) {
      console.error('Error preparing admin notification email:', error.message);
      throw error;
    }
  }

  private buildOrderLink(order?: any): string | undefined {
    const baseUrlEnv = process.env.ALLOWED_ORIGINS;
    const baseUrl = baseUrlEnv?.split(',')[0]?.trim() || 'https://13.online.ge';
    const orderIdentifier =
      typeof order === 'string'
        ? order
        : order?.orderNumber || order?._id?.toString();
    if (!orderIdentifier) {
      return undefined;
    }
    const normalizedBase = baseUrl.endsWith('/')
      ? baseUrl.slice(0, -1)
      : baseUrl;
    return `${normalizedBase}/orders/${orderIdentifier}`;
  }
}
