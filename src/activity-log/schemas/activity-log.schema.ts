import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true })
export class ActivityLog {
	@Prop({ type: Types.ObjectId, ref: 'Pact', required: true })
	pactId: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
	activityId: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	userId: Types.ObjectId;

	@Prop()
	notes?: string;

	@Prop({ required: true, default: false })
	verified: boolean;

	@Prop({ required: true, default: () => new Date() })
	occurredAt: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);


