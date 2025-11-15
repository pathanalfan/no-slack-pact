import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { Pact, PactSchema } from '../pact/schemas/pact.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: Pact.name, schema: PactSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ActivityService],
  controllers: [ActivityController],
  exports: [MongooseModule, ActivityService],
})
export class ActivityModule {}
