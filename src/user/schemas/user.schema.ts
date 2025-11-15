import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class PactDetails {
  @Prop({ type: Types.ObjectId, ref: 'Pact' })
  pactId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Activity' })
  primaryActivityId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Activity' })
  secondaryActivityId?: Types.ObjectId;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: PactDetails, _id: false })
  pactDetails?: PactDetails;
}

export const UserSchema = SchemaFactory.createForClass(User);

