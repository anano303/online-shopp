import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from '../services/app.service';

@Controller('')
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: '13-Online API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: {
        api: '/v1',
        docs: '/docs',
        health: '/',
      },
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const response = await this.appService.uploadImageToCloudinary(file);

    return response.url;
  }
}
