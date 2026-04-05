import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '@/types/role.enum';

// Saved address sub-schema
export class SavedAddress {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string; // e.g., "სახლი", "ოფისი"

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  postalCode?: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ default: false })
  isDefault: boolean;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret.__v;
      delete ret.password;
      ret.createdAt = ret.createdAt;
    },
  },
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String, enum: Role, default: Role.User })
  role: Role;
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop({ type: [String], default: [] })
  refreshTokens: string[]; // Array to support multiple sessions/devices

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ type: String, default: null })
  profileImagePath: string;

  @Prop({ type: [Object], default: [] })
  savedAddresses: SavedAddress[];
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});
