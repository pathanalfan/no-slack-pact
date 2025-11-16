import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './schemas/media.schema';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { GoogleDriveService } from './storage/google-drive.service';
import { Pact, PactSchema } from '../pact/schemas/pact.schema';
import { Activity, ActivitySchema } from '../activity/schemas/activity.schema';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Media.name, schema: MediaSchema },
			{ name: Pact.name, schema: PactSchema },
			{ name: Activity.name, schema: ActivitySchema },
			{ name: User.name, schema: UserSchema },
		]),
	],
	controllers: [MediaController],
	providers: [MediaService, GoogleDriveService],
	exports: [MediaService],
})
export class MediaModule {}


