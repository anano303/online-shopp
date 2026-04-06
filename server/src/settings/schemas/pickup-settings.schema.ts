import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PickupSettingsDocument = PickupSettings & Document;

@Schema({ timestamps: true })
export class PickupSettings {
  @Prop({ default: 'თბილისი, ვასილ კაკაბაძის ქ. N8' })
  address: string;

  @Prop({ default: 'თბილისი' })
  city: string;

  @Prop({ default: 'სამუშაო დღეებში 20:00 - 22:00' })
  workingHours: string;

  @Prop({ default: '+995 574150531' })
  phone: string;
}

export const PickupSettingsSchema =
  SchemaFactory.createForClass(PickupSettings);
