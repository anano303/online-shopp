import { IsOptional, IsString } from 'class-validator';

export class UpdateFooterSettingsDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  addressEn?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  messengerUrl?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoUrlDark?: string;

  @IsOptional()
  @IsString()
  sitePrimaryColor?: string;

  @IsOptional()
  @IsString()
  siteAccentColor?: string;

  @IsOptional()
  @IsString()
  siteTextColor?: string;

  @IsOptional()
  @IsString()
  siteTextSecondaryColor?: string;

  @IsOptional()
  @IsString()
  siteBackgroundColor?: string;

  @IsOptional()
  @IsString()
  siteBorderColor?: string;

  @IsOptional()
  @IsString()
  siteSuccessColor?: string;

  @IsOptional()
  @IsString()
  siteErrorColor?: string;

  @IsOptional()
  @IsString()
  siteWarningColor?: string;

  @IsOptional()
  @IsString()
  siteInfoColor?: string;

  @IsOptional()
  @IsString()
  siteBadgeColor?: string;
}
