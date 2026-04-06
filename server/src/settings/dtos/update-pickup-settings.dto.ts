import { IsOptional, IsString } from 'class-validator';

export class UpdatePickupSettingsDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  workingHours?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
