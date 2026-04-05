import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Allow,
} from 'class-validator';
import { Type } from 'class-transformer';

class PrivacySectionDto {
  @Allow()
  _id?: string;

  @IsString()
  title: string;

  @IsString()
  titleEn: string;

  @IsString()
  content: string;

  @IsString()
  contentEn: string;

  @IsOptional()
  @IsString()
  type?: 'paragraph' | 'list';
}

export class UpdatePrivacyPolicyDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrivacySectionDto)
  sections?: PrivacySectionDto[];

  @IsOptional()
  @IsString()
  effectiveDate?: string;

  @IsOptional()
  @IsString()
  effectiveDateEn?: string;
}
