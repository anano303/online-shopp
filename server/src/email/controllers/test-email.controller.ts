import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from '../services/email.services';

@Controller('test')
export class TestEmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-email')
  async testSendEmail(
    @Body() body: { email: string; type: 'order' | 'admin' },
  ) {
    console.log('🧪 Testing email send...', body);

    try {
      if (body.type === 'order') {
        // Test customer order confirmation email
        const testOrderData = {
          customerEmail: body.email,
          orderId: 'TEST-123456',
          customerName: 'Test Customer',
          items: [
            {
              name: 'Test Product',
              quantity: 2,
              price: 50.0,
              size: 'M',
              color: 'Red',
            },
          ],
          totalAmount: 100.0,
          shippingAddress: {
            firstName: 'Test',
            lastName: 'Customer',
            address: 'Test Address 123',
            city: 'Tbilisi',
            postalCode: '0102',
            phoneNumber: '+995555123456',
          },
          paymentMethod: 'BOG Payment',
          orderDate: new Date().toLocaleDateString('ka-GE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        await this.emailService.sendOrderConfirmationEmail(testOrderData);
        return { success: true, message: 'Customer email sent successfully' };
      } else if (body.type === 'admin') {
        // Test admin notification email
        const testOrderData = {
          orderId: 'TEST-123456',
          customerName: 'Test Customer',
          customerEmail: body.email,
          customerPhone: '+995555123456',
          items: [
            {
              name: 'Test Product',
              quantity: 2,
              price: 50.0,
              size: 'M',
              color: 'Red',
            },
          ],
          totalAmount: 100.0,
          shippingAddress: {
            firstName: 'Test',
            lastName: 'Customer',
            address: 'Test Address 123',
            city: 'Tbilisi',
            postalCode: '0102',
            phoneNumber: '+995555123456',
          },
          paymentMethod: 'BOG Payment',
          orderDate: new Date().toLocaleDateString('ka-GE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        await this.emailService.sendAdminOrderNotification(testOrderData);
        return { success: true, message: 'Admin email sent successfully' };
      }
    } catch (error) {
      console.error('❌ Email test failed:', error);
      return {
        success: false,
        message: 'Email sending failed',
        error: error.message,
      };
    }
  }
}
