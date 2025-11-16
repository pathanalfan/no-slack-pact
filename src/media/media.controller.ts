import { BadRequestException, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';

class UploadMediaDto {
	pactId: string;
	activityId: string;
	userId: string;
}

@Controller('media')
export class MediaController {
	constructor(private readonly mediaService: MediaService) {}

	@Post('upload')
	@HttpCode(HttpStatus.CREATED)
	@UseInterceptors(FileInterceptor('file'))
	async upload(@UploadedFile() file: Express.Multer.File, @Body() body: UploadMediaDto) {
		if (!file) throw new BadRequestException('file is required');
		if (!body?.pactId || !body?.activityId || !body?.userId) {
			throw new BadRequestException('pactId, activityId and userId are required');
		}
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
		return {
			id: saved._id,
			webViewLink: saved.webViewLink,
			webContentLink: saved.webContentLink,
			name: saved.name,
			mimeType: saved.mimeType,
			sizeBytes: saved.sizeBytes,
		};
	}
}


