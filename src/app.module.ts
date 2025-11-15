import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { PactModule } from './pact/pact.module';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [ConfigModule, DatabaseModule, UserModule, PactModule, ActivityModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
