import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FooterSettingsDocument = FooterSettings & Document;

@Schema({ timestamps: true })
export class FooterSettings {
  @Prop({ default: 'მისამართი: თბილისი, საქართველო' })
  address: string;

  @Prop({ default: 'Address: Tbilisi, Georgia' })
  addressEn: string;

  @Prop({ default: 'kakhaber.shop13@gmail.com' })
  email: string;

  @Prop({ default: '+995 574 150 531' })
  phone: string;

  @Prop({ default: '' })
  facebookUrl: string;

  @Prop({ default: '' })
  instagramUrl: string;

  @Prop({ default: 'https://www.facebook.com/magazia.tsa.meti' })
  messengerUrl: string;

  @Prop({ default: '' })
  logoUrl: string;

  @Prop({ default: '' })
  logoUrlDark: string;

  @Prop({ default: '#4b5320' })
  sitePrimaryColor: string;

  @Prop({ default: '#f48c06' })
  siteAccentColor: string;

  @Prop({ default: '#f5e9d1' })
  siteTextColor: string;

  @Prop({ default: '#d9c9a3' })
  siteTextSecondaryColor: string;

  @Prop({ default: '#121212' })
  siteBackgroundColor: string;

  @Prop({ default: '#555555' })
  siteBorderColor: string;

  @Prop({ default: '#4caf50' })
  siteSuccessColor: string;

  @Prop({ default: '#ff6b6b' })
  siteErrorColor: string;

  @Prop({ default: '#ffc107' })
  siteWarningColor: string;

  @Prop({ default: '#007bff' })
  siteInfoColor: string;

  @Prop({ default: '#ff6b6b' })
  siteBadgeColor: string;
}

export const FooterSettingsSchema =
  SchemaFactory.createForClass(FooterSettings);
