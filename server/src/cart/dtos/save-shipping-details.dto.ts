import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class SaveShippingDetailsDto {
  @IsString()
  @IsOptional()
  @IsIn(['pickup', 'delivery'])
  deliveryType?: 'pickup' | 'delivery';

  @IsString()
  address!: string;

  @IsString()
  city!: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  country!: string;

  @IsString()
  phoneNumber!: string;

  // These are optional frontend fields that should be ignored
  @IsBoolean()
  @IsOptional()
  saveAddress?: boolean;

  @IsString()
  @IsOptional()
  addressLabel?: string;
}
