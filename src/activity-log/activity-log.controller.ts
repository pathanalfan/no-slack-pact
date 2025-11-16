import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Param, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ActivityLogService } from './activity-log.service';
import { MediaService } from '../media/media.service';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { Query, Get } from '@nestjs/common';

class CreateActivityLogDto {
	@IsMongoId()
	pactId: string;

	@IsMongoId()
	activityId: string;

	@IsMongoId()
	userId: string;

	@IsOptional()
	@IsString()
	notes?: string;
}

@Controller('activity-logs')
export class ActivityLogController {
	constructor(
		private readonly activityLogService: ActivityLogService,
		private readonly mediaService: MediaService,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FilesInterceptor('files', 10))
	async create(
		@UploadedFiles() files: Express.Multer.File[],
		@Body() body: CreateActivityLogDto,
	) {
		if (!body?.pactId || !body?.activityId || !body?.userId) {
			throw new BadRequestException('pactId, activityId and userId are required');
		}

		const log = await this.activityLogService.create({
			pactId: body.pactId,
			activityId: body.activityId,
			userId: body.userId,
			notes: body.notes,
		});

		let media:
			| Array<{ webViewLink?: string; webContentLink?: string; name?: string; mimeType?: string; sizeBytes?: number }>
			| undefined;
		if (files?.length) {
			// Upload sequentially to avoid duplicate folder creation races
			const mediaAccum: Array<{ webViewLink?: string; webContentLink?: string; name?: string; mimeType?: string; sizeBytes?: number }> = [];
			for (const file of files) {
				// eslint-disable-next-line no-await-in-loop
				const saved = await this.mediaService.upload({
					userId: body.userId,
					pactId: body.pactId,
					activityId: body.activityId,
					file: {
						originalname: file.originalname,
						mimetype: file.mimetype,
						size: file.size,
						buffer: file.buffer,
					},
				});
				mediaAccum.push({
					webViewLink: saved.webViewLink,
					webContentLink: saved.webContentLink,
					name: saved.name,
					mimeType: saved.mimeType,
					sizeBytes: saved.sizeBytes,
				});
			}
			media = mediaAccum;
		}

		return {
			id: log._id,
			verified: log.verified,
			occurredAt: log.occurredAt,
			notes: log.notes,
			media,
		};
	}

	@Get('progress')
	async progress(
		@Query('pactId') pactId: string,
		@Query('activityId') activityId: string,
	) {
		if (!pactId || !activityId) {
			throw new BadRequestException('pactId and activityId are required');
		}
		return this.activityLogService.getWeeklyProgress({ pactId, activityId });
	}

	@Get('progress/user')
	async progressForUser(
		@Query('pactId') pactId: string,
		@Query('userId') userId: string,
	) {
		if (!pactId || !userId) {
			throw new BadRequestException('pactId and userId are required');
		}
		return this.activityLogService.getWeeklyProgressForUser({ pactId, userId });
	}

	@Get('progress/by-user')
	async progressByUser(
		@Query('userId') userId: string,
	) {
		if (!userId) throw new BadRequestException('userId is required');
		const data = await this.activityLogService.getWeeklyProgressByUserAcrossPacts({ userId });
		return { userId, results: data };
	}

	@Get('user-logs')
	async userLogsByPact(
		@Query('pactId') pactId: string,
		@Query('userId') userId: string,
	) {
		if (!pactId || !userId) {
			throw new BadRequestException('pactId and userId are required');
		}
		return this.activityLogService.getUserLogsByPactDateWise({ pactId, userId });
	}

	@Get(':id')
	async getLog(@Param('id') id?: string) {
		// Support /activity-logs?id=... to avoid path param conflicts
		const logId = id as string;
		if (!logId) {
			throw new BadRequestException('id is required');
		}
		return this.activityLogService.getLogDetails({ logId });
	}
}


