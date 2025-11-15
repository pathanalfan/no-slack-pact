import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Pact, PactSchema } from '../pact/schemas/pact.schema';
import { Activity, ActivitySchema } from '../activity/schemas/activity.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Pact.name, schema: PactSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [MongooseModule, UserService],
})
export class UserModule {}
