import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLog, ActivityLogDocument } from './schemas/activity-log.schema';
import { Pact, PactDocument } from '../pact/schemas/pact.schema';
import { Activity, ActivityDocument } from '../activity/schemas/activity.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { getCurrentIstWeekRange } from '../media/utils/ist-time.util';
import { Media, MediaDocument } from '../media/schemas/media.schema';

@Injectable()
export class ActivityLogService {
	constructor(
		@InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLogDocument>,
		@InjectModel(Pact.name) private pactModel: Model<PactDocument>,
		@InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
	) {}

	async create(params: {
		pactId: string;
		activityId: string;
		userId: string;
		notes?: string;
		occurredAt?: Date;
	}) {
		const pactId = new Types.ObjectId(params.pactId);
		const activityId = new Types.ObjectId(params.activityId);
		const userId = new Types.ObjectId(params.userId);

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
		const isParticipant = (pact.participants ?? []).some((p) => p.toString() === userId.toString());
		if (!isParticipant) throw new BadRequestException('User is not a participant of this pact');

		// Enforce single activity per day (IST) per user within a pact
		const now = params.occurredAt ?? new Date();
		const IST_OFFSET_MINUTES = 5 * 60 + 30;
		const utcTs = now.getTime();
		const ist = new Date(utcTs + IST_OFFSET_MINUTES * 60_000);
		const startIst = new Date(ist);
		startIst.setHours(0, 0, 0, 0);
		const endIst = new Date(ist);
		endIst.setHours(23, 59, 59, 999);
		const startUtc = new Date(startIst.getTime() - IST_OFFSET_MINUTES * 60_000);
		const endUtc = new Date(endIst.getTime() - IST_OFFSET_MINUTES * 60_000);

		const existing = await this.activityLogModel.findOne({
			pactId,
			userId,
			occurredAt: { $gte: startUtc, $lte: endUtc },
		});
		if (existing) {
			throw new BadRequestException('Activity already logged for today');
		}

		const doc = new this.activityLogModel({
			pactId,
			activityId,
			userId,
			notes: params.notes,
			verified: false,
			occurredAt: now,
		});
		return doc.save();
	}

	async getWeeklyProgress(params: { pactId: string; activityId: string }) {
		const pactId = new Types.ObjectId(params.pactId);
		const activityId = new Types.ObjectId(params.activityId);

		const pact = await this.pactModel.findById(pactId);
		const activity = await this.activityModel.findById(activityId);
		if (!pact) throw new NotFoundException('Pact not found');
		if (!activity || activity.pactId.toString() !== pactId.toString()) {
			throw new NotFoundException('Activity not found in this pact');
		}

		const { startUtc, endUtc } = getCurrentIstWeekRange(new Date());
		const logs = await this.activityLogModel
			.find(
				{
					pactId,
					activityId,
					occurredAt: { $gte: startUtc, $lte: endUtc },
				},
				{ userId: 1, occurredAt: 1 },
			)
			.lean();

		// Compute distinct IST day per user
		const IST_OFFSET_MINUTES = 5 * 60 + 30;
		const userIdToDays = new Map<string, Set<string>>();
		for (const log of logs) {
			const utcTs = new Date(log.occurredAt).getTime();
			const ist = new Date(utcTs + IST_OFFSET_MINUTES * 60_000);
			const dayKey = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
			const key = (log.userId as any).toString();
			if (!userIdToDays.has(key)) userIdToDays.set(key, new Set());
			userIdToDays.get(key)!.add(dayKey);
		}

		const targetDays = pact.minDaysPerWeek ?? 5;
		const users = (pact.participants as any[]).map((uid) => {
			const id = uid.toString();
			const days = userIdToDays.get(id);
			return { userId: id, targetDays, activityDays: days ? days.size : 0 };
		});
		return { targetDays, users };
	}

	async getWeeklyProgressForUser(params: { pactId: string; userId: string }) {
		const pactId = new Types.ObjectId(params.pactId);
		const userId = new Types.ObjectId(params.userId);

		const pact = await this.pactModel.findById(pactId);
		if (!pact) throw new NotFoundException('Pact not found');
		const isParticipant = (pact.participants ?? []).some((p) => p.toString() === userId.toString());
		if (!isParticipant) throw new BadRequestException('User is not a participant of this pact');

		const { startUtc, endUtc } = getCurrentIstWeekRange(new Date());
		const logs = await this.activityLogModel
			.find(
				{
					pactId,
					userId,
					occurredAt: { $gte: startUtc, $lte: endUtc },
				},
				{ occurredAt: 1 },
			)
			.lean();

		const IST_OFFSET_MINUTES = 5 * 60 + 30;
		const days = new Set<string>();
		for (const log of logs) {
			const utcTs = new Date(log.occurredAt).getTime();
			const ist = new Date(utcTs + IST_OFFSET_MINUTES * 60_000);
			const dayKey = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
			days.add(dayKey);
		}
		const targetDays = pact.minDaysPerWeek ?? 5;
		return { userId: params.userId, targetDays, activityDays: days.size };
	}

	async getWeeklyProgressByUserAcrossPacts(params: { userId: string }) {
		const userId = new Types.ObjectId(params.userId);
		// Find all pacts the user is part of
		const pacts = await this.pactModel.find({ participants: userId }, { _id: 1, minDaysPerWeek: 1 }).lean();
		const pactIds = pacts.map((p) => p._id as Types.ObjectId);
		if (pactIds.length === 0) return [];
		const pactIdToTarget = new Map<string, number>(pacts.map((p) => [(p._id as any).toString(), (p as any).minDaysPerWeek ?? 5]));

		const { startUtc, endUtc } = getCurrentIstWeekRange(new Date());
		const logs = await this.activityLogModel
			.find(
				{
					userId,
					pactId: { $in: pactIds },
					occurredAt: { $gte: startUtc, $lte: endUtc },
				},
				{ pactId: 1, occurredAt: 1 },
			)
			.lean();

		const IST_OFFSET_MINUTES = 5 * 60 + 30;
		const pactToDays = new Map<string, Set<string>>();
		for (const log of logs) {
			const utcTs = new Date(log.occurredAt).getTime();
			const ist = new Date(utcTs + IST_OFFSET_MINUTES * 60_000);
			const dayKey = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
			const pactKey = (log.pactId as any).toString();
			if (!pactToDays.has(pactKey)) pactToDays.set(pactKey, new Set());
			pactToDays.get(pactKey)!.add(dayKey);
		}

		return pactIds.map((pid) => {
			const key = pid.toString();
			const days = pactToDays.get(key);
			const targetDays = pactIdToTarget.get(key) ?? 5;
			return { pactId: key, targetDays, activityDays: days ? days.size : 0 };
		});
	}

	async getUserLogsByPactDateWise(params: { pactId: string; userId: string }) {
		const pactId = new Types.ObjectId(params.pactId);
		const userId = new Types.ObjectId(params.userId);

		const pact = await this.pactModel.findById(pactId);
		if (!pact) throw new NotFoundException('Pact not found');
		const isParticipant = (pact.participants ?? []).some((p) => p.toString() === userId.toString());
		if (!isParticipant) throw new BadRequestException('User is not a participant of this pact');

		const logs = await this.activityLogModel
			.find({ pactId, userId }, { occurredAt: 1, activityId: 1, notes: 1, verified: 1 })
			.sort({ occurredAt: -1 })
			.lean();

		// Group by IST date
		const IST_OFFSET_MINUTES = 5 * 60 + 30;
		const groups = new Map<string, Array<{ id: string; activityId: string; occurredAt: string; notes?: string; verified: boolean }>>();
		for (const l of logs) {
			const utcTs = new Date(l.occurredAt).getTime();
			const ist = new Date(utcTs + IST_OFFSET_MINUTES * 60_000);
			const dayKey = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
			if (!groups.has(dayKey)) groups.set(dayKey, []);
			groups.get(dayKey)!.push({
				id: (l as any)._id.toString(),
				activityId: (l.activityId as any).toString(),
				occurredAt: new Date(utcTs).toISOString(),
				notes: l.notes,
				verified: !!l.verified,
			});
		}

		// Return sorted by date desc
		const result = Array.from(groups.entries())
			.sort((a, b) => (a[0] < b[0] ? 1 : -1))
			.map(([date, items]) => ({ date, logs: items }));
		return { pactId: params.pactId, userId: params.userId, days: result };
	}

	async getLogDetails(params: { logId: string }) {
		const log = await this.activityLogModel.findById(params.logId).lean();
		if (!log) throw new NotFoundException('Activity log not found');
		const pactId = new Types.ObjectId((log.pactId as any).toString());
		const activityId = new Types.ObjectId((log.activityId as any).toString());
		const userId = new Types.ObjectId((log.userId as any).toString());

		// Compute IST day boundaries from occurredAt
		const IST_OFFSET_MINUTES = 5 * 60 + 30;
		const utcTs = new Date(log.occurredAt).getTime();
		const ist = new Date(utcTs + IST_OFFSET_MINUTES * 60_000);
		const startIst = new Date(ist); startIst.setHours(0, 0, 0, 0);
		const endIst = new Date(ist); endIst.setHours(23, 59, 59, 999);
		const startUtc = new Date(startIst.getTime() - IST_OFFSET_MINUTES * 60_000);
		const endUtc = new Date(endIst.getTime() - IST_OFFSET_MINUTES * 60_000);

		const media = await this.mediaModel.find(
			{
				pactId,
				activityId,
				userId,
				createdAt: { $gte: startUtc, $lte: endUtc },
			},
			{ name: 1, mimeType: 1, sizeBytes: 1, webViewLink: 1, webContentLink: 1 },
		).sort({ createdAt: 1 }).lean();

		const date = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
		return {
			id: (log as any)._id.toString(),
			date,
			occurredAt: new Date(utcTs).toISOString(),
			notes: log.notes ?? undefined,
			images: media.map((m) => ({
				name: m.name,
				mimeType: m.mimeType,
				sizeBytes: m.sizeBytes,
				webViewLink: m.webViewLink,
				webContentLink: m.webContentLink,
			})),
		};
	}
}


