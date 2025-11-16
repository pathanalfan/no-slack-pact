import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Media, MediaDocument } from './schemas/media.schema';
import { Pact, PactDocument } from '../pact/schemas/pact.schema';
import { Activity, ActivityDocument } from '../activity/schemas/activity.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { GoogleDriveService } from './storage/google-drive.service';
import { getCurrentIstWeekRange } from './utils/ist-time.util';
import { Readable } from 'stream';

const ALLOWED_MIME = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'video/mp4',
	'video/quicktime',
]);

@Injectable()
export class MediaService {
	constructor(
		@InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
		@InjectModel(Pact.name) private pactModel: Model<PactDocument>,
		@InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		private drive: GoogleDriveService,
	) {}

	private getLimits() {
		const maxImage = Number(process.env.MAX_IMAGE_BYTES ?? 10 * 1024 * 1024);
		const maxVideo = Number(process.env.MAX_VIDEO_BYTES ?? 100 * 1024 * 1024);
		return { maxImage, maxVideo };
	}

	async upload(params: {
		userId: string;
		pactId: string;
		activityId: string;
		file: { originalname: string; mimetype: string; size: number; buffer?: Buffer; stream?: Readable };
	}): Promise<MediaDocument> {
		const userId = new Types.ObjectId(params.userId);
		const pactId = new Types.ObjectId(params.pactId);
		const activityId = new Types.ObjectId(params.activityId);

		// Validate entities
		const [user, pact, activity] = await Promise.all([
			this.userModel.findById(userId),
			this.pactModel.findById(pactId),
			this.activityModel.findById(activityId),
		]);
		if (!user) throw new NotFoundException('User not found');
		if (!pact) throw new NotFoundException('Pact not found');
		if (!activity || activity.pactId.toString() !== pactId.toString()) {
			throw new NotFoundException('Activity not found in this pact');
		}
		// Ensure user is participant of pact
		const isParticipant = (pact.participants ?? []).some((p) => p.toString() === userId.toString());
		if (!isParticipant) throw new BadRequestException('User is not a participant of this pact');

		// Validate file
		if (!ALLOWED_MIME.has(params.file.mimetype)) {
			throw new BadRequestException('Unsupported file type');
		}
		const { maxImage, maxVideo } = this.getLimits();
		const isImage = params.file.mimetype.startsWith('image/');
		const isVideo = params.file.mimetype.startsWith('video/');
		if (isImage && params.file.size > maxImage) throw new BadRequestException('Image exceeds max size');
		if (isVideo && params.file.size > maxVideo) throw new BadRequestException('Video exceeds max size');

		// Determine weekly folder (IST) and pact folder
		const { label } = getCurrentIstWeekRange(new Date());
		const root = await this.drive.getOrCreateRootFolderId();
		// Structure: pact -> week -> user
		const pactFolder = await this.drive.ensureFolder(`pact_${pactId.toString()}`, root);
		const weekFolder = await this.drive.ensureFolder(label, pactFolder.id);
		const userFolder = await this.drive.ensureFolder(`user_${userId.toString()}`, weekFolder.id);

		// Share root only (children inherit)
		// Collect participant emails
		const participants = await this.userModel.find({ _id: { $in: pact.participants as any } }, { email: 1 }).lean();
		const emails = participants.map((u) => u.email).filter(Boolean);
		await this.drive.setFolderPermissionsForEmails(root, emails);

		// Upload file
		const bodyStream: Readable =
			params.file.stream ??
			Readable.from(params.file.buffer ?? Buffer.from([]));
		const uploaded = await this.drive.uploadFile({
			name: params.file.originalname,
			parentId: userFolder.id,
			mimeType: params.file.mimetype,
			body: bodyStream,
		});

		// Persist media
		const doc = new this.mediaModel({
			pactId,
			activityId,
			userId,
			provider: 'gdrive',
			providerFileId: uploaded.id,
			name: params.file.originalname,
			mimeType: params.file.mimetype,
			sizeBytes: params.file.size,
			visibility: (process.env.GDRIVE_DEFAULT_VISIBILITY as any) === 'private' ? 'private' : 'link',
			webViewLink: uploaded.webViewLink,
			webContentLink: uploaded.webContentLink,
		});
		return doc.save();
	}
}


