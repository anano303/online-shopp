import { Injectable } from '@nestjs/common';

import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;
  private emailFrom: string;

  constructor() {
    console.log('🔧 EmailService constructor called');

    // Runtime-ში ვკითხულობთ env ცვლადებს
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    this.emailFrom = process.env.EMAIL_FROM || 'no-reply@example.com';

    console.log('📧 Email config (runtime):', {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: emailUser ? '***' : 'NOT SET',
      pass: emailPass ? '***' : 'NOT SET',
      from: this.emailFrom,
    });

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log('✅ Email transporter created successfully');
  }

  private getFromEmail(): string {
    return this.emailFrom;
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetLink = `${process.env.ALLOWED_ORIGINS}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: this.getFromEmail(),
      to,
      subject: 'Password Reset Request',
      html: `
        <p>თქვენს ანგარიშზე პაროლის აღდგენის მოთხოვნა შევიდა.</p>
        <p>პაროლის აღსადგენად დააჭირეთ ქვემოთ მოცემულ ბმულს:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>თუ ეს თქვენ არ გაგიგზავნიათ, უბრალოდ არ იმოქმედოთ.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendOrderConfirmationEmail(orderData: {
    customerEmail: string;
    orderId: string;
    displayOrderId?: string;
    orderLink?: string;
    customerName: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      size?: string;
      color?: string;
      ageGroup?: string;
    }>;
    totalAmount: number;
    shippingAddress: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      postalCode?: string;
      phoneNumber: string;
    };
    paymentMethod: string;
    orderDate: string;
  }) {
    const orderIdentifier = orderData.displayOrderId || orderData.orderId;

    console.log('🚀 ATTEMPTING TO SEND CUSTOMER EMAIL:', {
      customerEmail: orderData.customerEmail,
      orderId: orderIdentifier,
      customerName: orderData.customerName,
    });

    try {
      const itemsHtml = orderData.items
        .map(
          (item) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; border-right: 1px solid #eee;">
            <strong>${item.name}</strong>
            ${item.size ? `<br><small>ზომა: ${item.size}</small>` : ''}
            ${item.color ? `<br><small>ფერი: ${item.color}</small>` : ''}
            ${item.ageGroup ? `<br><small>ასაკი: ${item.ageGroup}</small>` : ''}
          </td>
          <td style="padding: 12px; text-align: center; border-right: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 12px; text-align: right;">${item.price.toFixed(2)} ლარი</td>
        </tr>
      `,
        )
        .join('');

      const mailOptions = {
        from: this.getFromEmail(),
        to: orderData.customerEmail,
        subject: `შეკვეთის დადასტურება - #${orderIdentifier}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>შეკვეთის დადასტურება</title>
          <style>
            @media only screen and (max-width: 600px) {
              .email-container { 
                width: 100% !important; 
                padding: 10px !important; 
              }
              .email-content { 
                padding: 15px !important; 
              }
              .email-header h1 { 
                font-size: 22px !important; 
              }
              .email-table { 
                font-size: 14px !important; 
              }
              .email-table th, .email-table td { 
                padding: 8px 4px !important; 
                font-size: 12px !important; 
              }
              .total-row td { 
                font-size: 14px !important; 
              }
              .contact-section { 
                padding: 15px !important; 
              }
            }
          </style>
        </head>
        <body style="font-family: 'FiraGo', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div class="email-content" style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div class="email-header" style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4b5320; padding-bottom: 20px;">
              <h1 style="color: #4b5320; margin: 0; font-size: 28px;">ცამეტი</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 16px;">მამაკაცების კლასიკური ტანსაცმელი</p>
            </div>

            <!-- Order Confirmation -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #2d8a3e; margin-bottom: 15px;">✅ შეკვეთა წარმატებით დადასტურდა!</h2>
              <p style="font-size: 16px; margin-bottom: 10px;">გმადლობთ, <strong>${orderData.customerName}</strong>!</p>
              <p style="color: #666;">თქვენი შეკვეთა მიღებულია და დამუშავების პროცესშია.</p>
            </div>

            <!-- Order Details -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #4b5320; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px;">📋 შეკვეთის დეტალები</h3>
              <table style="width: 100%; margin-bottom: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">შეკვეთის ნომერი:</td>
                  <td style="padding: 8px 0; color: #2d8a3e; font-weight: bold;">#${orderIdentifier}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">თარიღი:</td>
                  <td style="padding: 8px 0;">${orderData.orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">გადახდის მეთოდი:</td>
                  <td style="padding: 8px 0;">${orderData.paymentMethod}</td>
                </tr>
              </table>
              ${
                orderData.orderLink
                  ? `<div style="text-align: center; margin-top: 15px;">
                    <a href="${orderData.orderLink}" style="display: inline-block; background-color: #4b5320; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">შეკვეთის ნახვა ვებგვერდზე</a>
                  </div>`
                  : ''
              }
            </div>

            <!-- Items Table -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #4b5320; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px;">🛒 შეკვეთილი პროდუქტები</h3>
              <table class="email-table" style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-right: 1px solid #eee; font-weight: bold; color: #4b5320;">პროდუქტი</th>
                    <th style="padding: 12px; text-align: center; border-right: 1px solid #eee; font-weight: bold; color: #4b5320;">რაოდ.</th>
                    <th style="padding: 12px; text-align: right; font-weight: bold; color: #4b5320;">ფასი</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr class="total-row" style="background-color: #2d8a3e; color: white; font-weight: bold;">
                    <td colspan="2" style="padding: 15px; text-align: right;">სულ ჯამი:</td>
                    <td style="padding: 15px; text-align: right; font-size: 18px;">${orderData.totalAmount.toFixed(2)} ლარი</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Shipping Address -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #4b5320; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px;">🚚 მიწოდების მისამართი</h3>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2d8a3e;">
                <p style="margin: 0 0 8px 0;"><strong>${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}</strong></p>
                <p style="margin: 0 0 8px 0;">${orderData.shippingAddress.address}</p>
                <p style="margin: 0 0 8px 0;">${orderData.shippingAddress.city}${orderData.shippingAddress.postalCode ? `, ${orderData.shippingAddress.postalCode}` : ''}</p>
                <p style="margin: 0 0 8px 0;">📞 ${orderData.shippingAddress.phoneNumber}</p>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #4b5320; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px;">📦 შემდგომი ნაბიჯები</h3>
              <ul style="color: #666; padding-left: 20px;">
                <li style="margin-bottom: 8px;">თქვენი შეკვეთა დამუშავების პროცესშია</li>
                <li style="margin-bottom: 8px;">1-2 სამუშაო დღის განმავლობაში მოვამზადებთ თქვენს შეკვეთას</li>
                <li style="margin-bottom: 8px;">მიწოდების დროს გაგიგზავნით SMS შეტყობინება</li>
                <li style="margin-bottom: 8px;">შეკვეთის სტატუსი შეგიძლიათ მონიტორინგი გაუწიოთ ჩვენს ვებსაიტზე</li>
              </ul>
            </div>

            <!-- Contact Info -->
            <div class="contact-section" style="background-color: #4b5320; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 15px 0;">📞 კონტაქტი</h3>
              <p style="margin: 0 0 8px 0;">კითხვების შემთხვევაში დაგვიკავშირდით:</p>
              <p style="margin: 0 0 8px 0;">📧 <a href="mailto:kakhaber.shop13@gmail.com" style="color: #fff; text-decoration: underline;">kakhaber.shop13@gmail.com</a></p>
              <p style="margin: 0 0 8px 0;">📱 <a href="tel:+995574150531" style="color: #fff; text-decoration: underline;">+995 574150531</a></p>
              <p style="margin: 0;">🌐 <a href="https://13.online.ge" style="color: #fff; text-decoration: underline;">13.online.ge</a></p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
              <p>გმადლობთ ცამეტის არჩევისთვის!</p>
              <p style="margin: 10px 0 0 0;">© 2025 ცამეტი. ყველა უფლება დაცულია.</p>
            </div>

            </div>
          </div>
        </body>
        </html>
      `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ CUSTOMER EMAIL SENT SUCCESSFULLY!');
    } catch (error) {
      console.error('❌ ERROR SENDING CUSTOMER EMAIL:', error);
      throw error;
    }
  }

  async sendAdminOrderNotification(orderData: {
    orderId: string;
    displayOrderId?: string;
    orderLink?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      size?: string;
      color?: string;
      ageGroup?: string;
    }>;
    totalAmount: number;
    shippingAddress: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      postalCode?: string;
      phoneNumber: string;
    };
    paymentMethod: string;
    orderDate: string;
  }) {
    const orderIdentifier = orderData.displayOrderId || orderData.orderId;

    console.log('🚀 ATTEMPTING TO SEND ADMIN EMAIL:', {
      orderId: orderIdentifier,
      customerEmail: orderData.customerEmail,
      adminEmail: process.env.ADMIN_EMAIL,
    });

    try {
      const itemsHtml = orderData.items
        .map(
          (item) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; border-right: 1px solid #eee;">
            <strong>${item.name}</strong>
            ${item.size ? `<br><small>ზომა: ${item.size}</small>` : ''}
            ${item.color ? `<br><small>ფერი: ${item.color}</small>` : ''}
            ${item.ageGroup ? `<br><small>ასაკი: ${item.ageGroup}</small>` : ''}
          </td>
          <td style="padding: 10px; text-align: center; border-right: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right;">${item.price.toFixed(2)} ლარი</td>
        </tr>
      `,
        )
        .join('');

      // Admin email - send to store management
      const adminEmail = process.env.ADMIN_EMAIL || 'kakhaber.shop13@gmail.com';

      console.log('📧 SENDING EMAIL FROM:', this.getFromEmail());
      console.log('📧 SENDING EMAIL TO:', adminEmail);

      const mailOptions = {
        from: this.getFromEmail(),
        to: adminEmail,
        subject: `🛒 ახალი შეკვეთა - #${orderIdentifier}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ახალი შეკვეთა</title>
          <style>
            @media only screen and (max-width: 600px) {
              .admin-email-container { 
                width: 100% !important; 
                padding: 10px !important; 
              }
              .admin-email-content { 
                padding: 15px !important; 
              }
              .admin-header h1 { 
                font-size: 22px !important; 
              }
              .admin-table { 
                font-size: 14px !important; 
              }
              .admin-table th, .admin-table td { 
                padding: 6px 3px !important; 
                font-size: 11px !important; 
              }
              .admin-total-row td { 
                font-size: 14px !important; 
              }
            }
          </style>
        </head>
        <body style="font-family: 'FiraGo', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div class="admin-email-container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div class="admin-email-content" style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div class="admin-header" style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #e74c3c; padding-bottom: 20px;">
              <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">🚨 ახალი შეკვეთა!</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 16px;">ცამეტი Admin Panel</p>
            </div>

            <!-- Order Alert -->
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
              <h3 style="color: #856404; margin: 0 0 10px 0;">⚡ URGENT: ახალი შეკვეთა მიღებულია</h3>
              <p style="margin: 0; color: #856404;">შეკვეთა #${orderIdentifier} დაუყოვნებლივ დამუშავებას ითხოვს</p>
            </div>

            <!-- Customer Info -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #e74c3c; margin-bottom: 15px;">👤 მყიდველის ინფორმაცია</h3>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                <p style="margin: 0 0 8px 0;"><strong>სახელი:</strong> ${orderData.customerName}</p>
                <p style="margin: 0 0 8px 0;"><strong>ელ-ფოსტა:</strong> <a href="mailto:${orderData.customerEmail}">${orderData.customerEmail}</a></p>
                <p style="margin: 0;"><strong>ტელეფონი:</strong> <a href="tel:${orderData.customerPhone}">${orderData.customerPhone}</a></p>
              </div>
            </div>

            <!-- Order Details -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #e74c3c; margin-bottom: 15px;">📋 შეკვეთის დეტალები</h3>
              <table style="width: 100%; margin-bottom: 15px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">შეკვეთის ნომერი:</td>
                  <td style="padding: 5px 0; color: #e74c3c; font-weight: bold;">#${orderIdentifier}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">თარიღი:</td>
                  <td style="padding: 5px 0;">${orderData.orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">გადახდის მეთოდი:</td>
                  <td style="padding: 5px 0;">${orderData.paymentMethod}</td>
                </tr>
              </table>
            </div>

            <!-- Items -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #e74c3c; margin-bottom: 15px;">🛒 შეკვეთილი პროდუქტები</h3>
              <table class="admin-table" style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                <thead>
                  <tr style="background-color: #e74c3c; color: white;">
                    <th style="padding: 10px; text-align: left;">პროდუქტი</th>
                    <th style="padding: 10px; text-align: center;">რაოდ.</th>
                    <th style="padding: 10px; text-align: right;">ფასი</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr class="admin-total-row" style="background-color: #28a745; color: white; font-weight: bold;">
                    <td colspan="2" style="padding: 12px; text-align: right;">სულ ჯამი:</td>
                    <td style="padding: 12px; text-align: right; font-size: 18px;">${orderData.totalAmount.toFixed(2)} ლარი</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Shipping Address -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #e74c3c; margin-bottom: 15px;">🚚 მიწოდების მისამართი</h3>
              <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0 0 5px 0;"><strong>${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}</strong></p>
                <p style="margin: 0 0 5px 0;">${orderData.shippingAddress.address}</p>
                <p style="margin: 0 0 5px 0;">${orderData.shippingAddress.city}${orderData.shippingAddress.postalCode ? `, ${orderData.shippingAddress.postalCode}` : ''}</p>
                <p style="margin: 0;">📞 ${orderData.shippingAddress.phoneNumber}</p>
              </div>
            </div>

            <!-- Action Required -->
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; border-radius: 5px; text-align: center;">
              <h3 style="color: #721c24; margin: 0 0 10px 0;">⚠️ მოქმედება საჭიროა</h3>
              <p style="margin: 0 0 15px 0; color: #721c24;">გთხოვთ დაუყოვნებლივ დაამუშავოთ ეს შეკვეთა</p>
              <p style="margin: 0; color: #721c24; font-weight: bold;">შეკვეთა: #${orderIdentifier}</p>
              ${
                orderData.orderLink
                  ? `<div style="margin-top: 15px;">
                    <a href="${orderData.orderLink}" style="display: inline-block; background-color: #dc3545; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold;">გახსენი შეკვეთა</a>
                  </div>`
                  : ''
              }
            </div>

          </div>
        </body>
        </html>
      `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ ADMIN EMAIL SENT SUCCESSFULLY!');
    } catch (error) {
      console.error('❌ ERROR SENDING ADMIN EMAIL:', error);
      throw error;
    }
  }

  async sendContactFormEmail(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL || 'kakhaber.shop13@gmail.com';

    console.log('📧 Sending contact form email to admin:', adminEmail);

    const mailOptions = {
      from: this.getFromEmail(),
      to: adminEmail,
      subject: `[ცამეტი Contact] ${contactData.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <div style="background: linear-gradient(135deg, #5b6c18, #4a5a14); padding: 25px; text-align: center;">
              <h1 style="color: #f5e9d1; margin: 0; font-size: 24px;">📬 ახალი შეტყობინება</h1>
              <p style="color: #d4c5a9; margin: 10px 0 0 0;">ცამეტი - საკონტაქტო ფორმა</p>
            </div>

            <div style="padding: 25px;">
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #5b6c18; margin: 0 0 15px 0;">👤 გამომგზავნის ინფორმაცია</h3>
                <p style="margin: 5px 0;"><strong>სახელი:</strong> ${contactData.name}</p>
                <p style="margin: 5px 0;"><strong>ელ-ფოსტა:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
              </div>

              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #5b6c18; margin: 0 0 15px 0;">📝 თემა</h3>
                <p style="margin: 0; font-size: 16px; font-weight: bold;">${contactData.subject}</p>
              </div>

              <div style="background: #fff3cd; border-radius: 8px; padding: 20px; border-left: 4px solid #5b6c18;">
                <h3 style="color: #5b6c18; margin: 0 0 15px 0;">💬 შეტყობინება</h3>
                <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${contactData.message}</p>
              </div>

              <div style="margin-top: 20px; text-align: center;">
                <a href="mailto:${contactData.email}?subject=Re: ${contactData.subject}" 
                   style="display: inline-block; background: #5b6c18; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  📧 პასუხის გაგზავნა
                </a>
              </div>
            </div>

            <div style="background: #2a2a2a; padding: 15px; text-align: center;">
              <p style="color: #888; margin: 0; font-size: 12px;">ეს შეტყობინება გაიგზავნა ცამეტის საკონტაქტო ფორმიდან</p>
            </div>

          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Contact form email sent successfully!');
    } catch (error) {
      console.error('❌ Error sending contact form email:', error);
      throw error;
    }
  }

  /**
   * Send delivery confirmation email with review request
   */
  async sendDeliveryConfirmationEmail(orderData: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    orderItems: Array<{
      name: string;
      productId: string;
      image?: string;
    }>;
  }) {
    const baseUrl =
      process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim() ||
      'https://www.13.online.ge';

    const productLinks = orderData.orderItems
      .map(
        (item) => `
      <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px; display: flex; align-items: center;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />` : ''}
        <div style="flex: 1;">
          <h4 style="margin: 0 0 10px 0; color: #333;">${item.name}</h4>
          <a href="${baseUrl}/products/${item.productId}#reviews" 
             style="display: inline-block; background: #4b5320; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            ⭐ შეაფასეთ პროდუქტი
          </a>
        </div>
      </div>
    `,
      )
      .join('');

    const mailOptions = {
      from: this.getFromEmail(),
      to: orderData.customerEmail,
      subject: `შეკვეთა #${orderData.orderNumber} მიტანილია - გთხოვთ შეაფასოთ პროდუქტები`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 20px; background-color: #1a1a1a; font-family: 'FiraGo', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #2a2a2a; border-radius: 12px; overflow: hidden; border: 1px solid #4b5320;">
            
            <div style="background: linear-gradient(135deg, #4b5320 0%, #3a4119 100%); padding: 30px; text-align: center;">
              <h1 style="color: #f5e9d1; margin: 0; font-size: 24px;">📦 შეკვეთა მიტანილია!</h1>
              <p style="color: #d4c5a9; margin: 10px 0 0 0;">ცამეტი - შეკვეთა #${orderData.orderNumber}</p>
            </div>

            <div style="padding: 25px;">
              <p style="color: #e6cd9f; font-size: 16px; margin-bottom: 20px;">
                გამარჯობა, ${orderData.customerName}!
              </p>
              
              <p style="color: #a99c7a; font-size: 14px; margin-bottom: 25px;">
                თქვენი შეკვეთა მიტანილია წარმატებით . გთხოვთ, დაუთმოთ რამდენიმე წამი და შეაფასოთ შეძენილი პროდუქტები. თქვენი შეფასება დაეხმარება სხვა მომხმარებლებს სწორი არჩევანის გაკეთებაში.
              </p>

              <h3 style="color: #e6cd9f; margin-bottom: 15px;">🛒 შეძენილი პროდუქტები:</h3>
              
              ${productLinks}

              <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin-top: 20px; border-left: 4px solid #4b5320;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  💡 <strong>რატომ არის მნიშვნელოვანი თქვენი შეფასება?</strong><br>
                  თქვენი გამოხმაურება გვეხმარება სერვისის გაუმჯობესებაში და სხვა მყიდველებს ინფორმირებული გადაწყვეტილების მიღებაში.
                </p>
              </div>
            </div>

            <div style="background: #1a1a1a; padding: 20px; text-align: center;">
              <p style="color: #888; margin: 0; font-size: 12px;">
                გმადლობთ რომ აირჩიეთ ცამეტი!<br>
                თუ გაქვთ შეკითხვები, დაგვიკავშირდით: kakhaber.shop13@gmail.com
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(
        `✅ Delivery confirmation email sent to ${orderData.customerEmail}`,
      );
    } catch (error) {
      console.error('❌ Error sending delivery confirmation email:', error);
      throw error;
    }
  }

  /**
   * გაგზავნის ადმინისტრატორს შეტყობინებას პროდუქტის მარაგის ამოწურვის შესახებ
   */
  async sendOutOfStockNotificationEmail(productData: {
    productName: string;
    productId: string;
    currentStock: number;
    variantInfo?: string;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL || 'kakhaber.shop13@gmail.com';
    const baseUrl =
      process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim() ||
      'https://www.13.online.ge';

    const productLink = `${baseUrl}/admin/products/${productData.productId}`;

    const mailOptions = {
      from: this.getFromEmail(),
      to: adminEmail,
      subject: `⚠️ მარაგი ამოიწურა: ${productData.productName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 20px; background-color: #1a1a1a; font-family: 'FiraGo', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #2a2a2a; border-radius: 12px; overflow: hidden; border: 1px solid #dc3545;">
            
            <div style="background: linear-gradient(135deg, #dc3545 0%, #a71d2a 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ მარაგი ამოწურულია!</h1>
              <p style="color: #f8d7da; margin: 10px 0 0 0;">ცამეტი - ადმინ შეტყობინება</p>
            </div>

            <div style="padding: 25px;">
              <div style="background: #fff3cd; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
                <h3 style="margin: 0 0 15px 0; color: #856404;">📦 პროდუქტის ინფორმაცია:</h3>
                <table style="width: 100%; color: #856404;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">პროდუქტი:</td>
                    <td style="padding: 8px 0;">${productData.productName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">მიმდინარე მარაგი:</td>
                    <td style="padding: 8px 0; color: #dc3545; font-weight: bold;">${productData.currentStock}</td>
                  </tr>
                  ${
                    productData.variantInfo
                      ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">ვარიანტი:</td>
                    <td style="padding: 8px 0;">${productData.variantInfo}</td>
                  </tr>
                  `
                      : ''
                  }
                </table>
              </div>

              <div style="text-align: center; margin-top: 20px;">
                <a href="${productLink}" 
                   style="display: inline-block; background: #4b5320; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  🔄 პროდუქტის მარაგის განახლება
                </a>
              </div>

              <p style="color: #a99c7a; font-size: 14px; margin-top: 25px; text-align: center;">
                გთხოვთ, რაც შეიძლება სწრაფად განაახლოთ პროდუქტის მარაგი, რომ თავიდან აიცილოთ გაყიდვების დაკარგვა.
              </p>
            </div>

            <div style="background: #1a1a1a; padding: 20px; text-align: center;">
              <p style="color: #888; margin: 0; font-size: 12px;">
                ეს ავტომატური შეტყობინებაა ცამეტი სისტემიდან
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(
        `✅ Out of stock notification sent to admin for product: ${productData.productName}`,
      );
    } catch (error) {
      console.error('❌ Error sending out of stock notification:', error);
      // Don't throw - this is a notification, not critical
    }
  }
}
