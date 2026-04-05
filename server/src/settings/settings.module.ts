import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';
import {
  FooterSettings,
  FooterSettingsSchema,
} from './schemas/footer-settings.schema';
import {
  PrivacyPolicy,
  PrivacyPolicySchema,
} from './schemas/privacy-policy.schema';
import { AboutPage, AboutPageSchema } from './schemas/about-page.schema';
import {
  TermsConditions,
  TermsConditionsSchema,
} from './schemas/terms-conditions.schema';
import {
  ReturnPolicy,
  ReturnPolicySchema,
} from './schemas/return-policy.schema';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FooterSettings.name, schema: FooterSettingsSchema },
      { name: PrivacyPolicy.name, schema: PrivacyPolicySchema },
      { name: AboutPage.name, schema: AboutPageSchema },
      { name: TermsConditions.name, schema: TermsConditionsSchema },
      { name: ReturnPolicy.name, schema: ReturnPolicySchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
