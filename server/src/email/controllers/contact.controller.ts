import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailService } from '../services/email.services';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

class ContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send contact form message to admin' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  @ApiResponse({ status: 500, description: 'Failed to send message' })
  async sendContactMessage(@Body() contactDto: ContactDto) {
    try {
      await this.emailService.sendContactFormEmail(contactDto);
      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      console.error('Failed to send contact email:', error);
      throw error;
    }
  }
}
