import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AboutPageDocument = AboutPage & Document;

@Schema({ timestamps: true })
export class AboutPage {
  @Prop({ default: 'ჩვენს შესახებ' })
  title: string;

  @Prop({ default: 'About Us' })
  titleEn: string;

  @Prop({
    type: [
      {
        text: String,
        textEn: { type: String, default: '' },
        type: { type: String, default: 'normal' },
      },
    ],
    default: [],
  })
  sections: {
    text: string;
    textEn: string;
    type: 'normal' | 'highlight' | 'quote' | 'final';
  }[];

  @Prop({ default: 'ეწვიეთ ჩვენს მაღაზიას და აღმოაჩინეთ ხარისხიანი სტილი!' })
  ctaText: string;

  @Prop({ default: 'Visit our store and discover quality style!' })
  ctaTextEn: string;

  @Prop({ default: 'გაიცანით ჩვენი გუნდი' })
  teamTitle: string;

  @Prop({ default: 'Meet Our Team' })
  teamTitleEn: string;

  @Prop({
    type: [
      {
        name: String,
        nameEn: { type: String, default: '' },
        position: String,
        positionEn: { type: String, default: '' },
        bio: String,
        bioEn: { type: String, default: '' },
        image: { type: String, default: '' },
      },
    ],
    default: [],
  })
  teamMembers: {
    name: string;
    nameEn: string;
    position: string;
    positionEn: string;
    bio: string;
    bioEn: string;
    image: string;
  }[];
}

export const AboutPageSchema = SchemaFactory.createForClass(AboutPage);
