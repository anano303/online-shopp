import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReturnPolicyDocument = ReturnPolicy & Document;

@Schema({ timestamps: true })
export class ReturnPolicy {
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

  @Prop({ default: '20 ნოემბერი, 2025' })
  effectiveDate: string;

  @Prop({ default: 'November 20, 2025' })
  effectiveDateEn: string;
}

export const ReturnPolicySchema = SchemaFactory.createForClass(ReturnPolicy);
