import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PactDocument = Pact & Document;

@Schema({ timestamps: true })
export class Pact {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  participants: Types.ObjectId[];

  @Prop({ default: 'active' })
  status: string; // active, completed, cancelled

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ required: true })
  minDaysPerWeek: number; // Minimum number of days activities need to be performed in a week

  @Prop({ required: true })
  maxActivitiesPerUser: number; // Maximum number of activities performed per user

  @Prop({ required: true })
  skipFine: number; // Fine amount for skipping an activity

  @Prop({ required: true })
  leaveFine: number; // Fine amount for leaving the pact
}

export const PactSchema = SchemaFactory.createForClass(Pact);

