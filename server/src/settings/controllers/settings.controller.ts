import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from '../services/settings.service';
import { UpdateFooterSettingsDto } from '../dtos/update-footer-settings.dto';
import { UpdatePrivacyPolicyDto } from '../dtos/update-privacy-policy.dto';
// import { UpdateAboutPageDto } from '../dtos/update-about-page.dto';
import { UpdateTermsConditionsDto } from '../dtos/update-terms-conditions.dto';
import { UpdateReturnPolicyDto } from '../dtos/update-return-policy.dto';
import { UpdatePickupSettingsDto } from '../dtos/update-pickup-settings.dto';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { RolesGuard } from '@/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { Role } from '@/types/role.enum';
import { CloudinaryService } from '@/cloudinary/services/cloudinary.service';
import { UpdateAboutPageDto } from '../dtos/update-about-page.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('footer')
  async getFooterSettings() {
    return this.settingsService.getFooterSettings();
  }

  @Put('footer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateFooterSettings(@Body() dto: UpdateFooterSettingsDto) {
    return this.settingsService.updateFooterSettings(dto);
  }

  @Get('about')
  async getAboutPage() {
    return this.settingsService.getAboutPage();
  }

  @Put('about')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateAboutPage(@Body() dto: UpdateAboutPageDto) {
    return this.settingsService.updateAboutPage(dto);
  }

  @Get('privacy-policy')
  async getPrivacyPolicy() {
    return this.settingsService.getPrivacyPolicy();
  }

  @Put('privacy-policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updatePrivacyPolicy(@Body() dto: UpdatePrivacyPolicyDto) {
    return this.settingsService.updatePrivacyPolicy(dto);
  }

  @Get('terms-conditions')
  async getTermsConditions() {
    return this.settingsService.getTermsConditions();
  }

  @Put('terms-conditions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateTermsConditions(@Body() dto: UpdateTermsConditionsDto) {
    return this.settingsService.updateTermsConditions(dto);
  }

  @Get('return-policy')
  async getReturnPolicy() {
    return this.settingsService.getReturnPolicy();
  }

  @Put('return-policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateReturnPolicy(@Body() dto: UpdateReturnPolicyDto) {
    return this.settingsService.updateReturnPolicy(dto);
  }

  @Post('about/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAboutImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const result = await this.cloudinaryService.uploadImage(file);
    const optimizedUrl = result.secure_url.replace(
      '/upload/',
      '/upload/q_auto,f_auto,w_800/',
    );
    return { url: optimizedUrl };
  }

  @Post('logo/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const result = await this.cloudinaryService.uploadImage(file);
    const optimizedUrl = result.secure_url.replace(
      '/upload/',
      '/upload/q_auto,f_auto/',
    );
    // Save to footer settings based on mode
    const field = mode === 'dark' ? 'logoUrlDark' : 'logoUrl';
    await this.settingsService.updateFooterSettings({ [field]: optimizedUrl });
    return { url: optimizedUrl, field };
  }

  @Get('pickup')
  async getPickupSettings() {
    return this.settingsService.getPickupSettings();
  }

  @Put('pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async updatePickupSettings(@Body() dto: UpdatePickupSettingsDto) {
    return this.settingsService.updatePickupSettings(dto);
  }
}
