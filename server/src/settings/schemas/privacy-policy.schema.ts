import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrivacyPolicyDocument = PrivacyPolicy & Document;

@Schema({ timestamps: true })
export class PrivacyPolicy {
  @Prop({
    type: [
      {
        title: String,
        titleEn: String,
        content: String,
        contentEn: String,
        type: { type: String, default: 'paragraph' },
      },
    ],
    default: [],
  })
  sections: {
    title: string;
    titleEn: string;
    content: string;
    contentEn: string;
    type: 'paragraph' | 'list';
  }[];

  @Prop({ default: '1 ივნისი, 2025' })
  effectiveDate: string;

  @Prop({ default: 'January 1, 2025' })
  effectiveDateEn: string;
}

export const PrivacyPolicySchema = SchemaFactory.createForClass(PrivacyPolicy);
