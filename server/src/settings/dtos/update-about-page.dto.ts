import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Allow,
} from 'class-validator';
import { Type } from 'class-transformer';

class AboutSectionDto {
  @Allow()
  _id?: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  textEn?: string;

  @IsOptional()
  @IsString()
  type?: 'normal' | 'highlight' | 'quote' | 'final';
}

class TeamMemberDto {
  @Allow()
  _id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsString()
  position: string;

  @IsOptional()
  @IsString()
  positionEn?: string;

  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  bioEn?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class UpdateAboutPageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AboutSectionDto)
  sections?: AboutSectionDto[];

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  ctaTextEn?: string;

  @IsOptional()
  @IsString()
  teamTitle?: string;

  @IsOptional()
  @IsString()
  teamTitleEn?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  teamMembers?: TeamMemberDto[];
}
