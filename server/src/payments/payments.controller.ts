import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('bog/create')
  async createBogPayment(@Body() data: any) {
    try {
      const result = await this.paymentsService.createPayment(data);

      // Update order with both external_order_id (our UUID) and BOG's order_id
      if (result.uniqueId && result.order_id && data.product?.productId) {
        try {
          await this.paymentsService.updateOrderWithBogIds(
            data.product.productId,
            result.uniqueId,
            result.order_id,
          );
        } catch (error) {
          console.error('Failed to update order with BOG IDs:', error);
          // Continue with payment creation even if this fails
        }
      }

      return result;
    } catch (error) {
      console.error('BOG Payment Error:', error);
      throw error;
    }
  }

  @Get('bog/status/:orderId')
  async getBogPaymentStatus(@Param('orderId') orderId: string) {
    console.log('📊 Checking BOG status for order:', orderId);
    const status = await this.paymentsService.getPaymentStatus(orderId);
    console.log('📋 BOG status result:', JSON.stringify(status, null, 2));
    return status;
  }

  @Post('bog/callback')
  async handleBogCallback(@Body() data: any) {
    console.log(
      '🔔 BOG Payment Callback endpoint hit at:',
      new Date().toISOString(),
    );
    console.log('📦 Callback raw body:', JSON.stringify(data, null, 2));
    console.log('📊 Callback data keys:', Object.keys(data));

    const result = await this.paymentsService.handlePaymentCallback(data);

    console.log(
      '✅ Callback processing result:',
      JSON.stringify(result, null, 2),
    );

    return {
      status: result.success ? 'success' : 'failed',
      message: result.message,
    };
  }
}
