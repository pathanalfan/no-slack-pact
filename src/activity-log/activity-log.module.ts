import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { Pact, PactSchema } from '../pact/schemas/pact.schema';
import { Activity, ActivitySchema } from '../activity/schemas/activity.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { MediaModule } from '../media/media.module';
import { Media, MediaSchema } from '../media/schemas/media.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ActivityLog.name, schema: ActivityLogSchema },
			{ name: Pact.name, schema: PactSchema },
			{ name: Activity.name, schema: ActivitySchema },
			{ name: User.name, schema: UserSchema },
			{ name: Media.name, schema: MediaSchema },
		]),
		MediaModule,
	],
	providers: [ActivityLogService],
	controllers: [ActivityLogController],
	exports: [MongooseModule, ActivityLogService],
})
export class ActivityLogModule {}


