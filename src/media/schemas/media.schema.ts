import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MediaDocument = Media & Document;

@Schema({ timestamps: true })
export class Media {
	@Prop({ type: Types.ObjectId, ref: 'Pact', required: true })
	pactId: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
	activityId: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	userId: Types.ObjectId;

	@Prop({ required: true, enum: ['gdrive'] })
	provider: 'gdrive';

	@Prop({ required: true })
	providerFileId: string;

	@Prop({ required: true })
	name: string;

	@Prop({ required: true })
	mimeType: string;

	@Prop({ required: true })
	sizeBytes: number;

	@Prop({ required: true, enum: ['link', 'private'], default: 'link' })
	visibility: 'link' | 'private';

	@Prop()
	webViewLink?: string;

	@Prop()
	webContentLink?: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);


