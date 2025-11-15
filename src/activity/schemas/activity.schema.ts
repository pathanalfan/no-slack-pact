import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: true })
export class Activity {
  @Prop({ type: Types.ObjectId, ref: 'Pact', required: true })
  pactId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // User who created the activity

  @Prop({ required: true })
  name: string; // Name of the activity

  @Prop()
  description?: string; // Description of the activity

  @Prop({ required: true })
  numberOfDays: number; // Number of days performing that activity

  @Prop({ required: true, default: false })
  isPrimary: boolean; // Whether that activity is primary
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

