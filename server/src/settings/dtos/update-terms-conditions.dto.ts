import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Allow,
} from 'class-validator';
import { Type } from 'class-transformer';

class TermsSectionDto {
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

export class UpdateTermsConditionsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TermsSectionDto)
  sections?: TermsSectionDto[];

  @IsOptional()
  @IsString()
  effectiveDate?: string;

  @IsOptional()
  @IsString()
  effectiveDateEn?: string;
}
