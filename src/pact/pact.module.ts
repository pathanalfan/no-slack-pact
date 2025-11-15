import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pact, PactSchema } from './schemas/pact.schema';
import { PactService } from './pact.service';
import { PactController } from './pact.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Pact.name, schema: PactSchema }])],
  providers: [PactService],
  controllers: [PactController],
  exports: [MongooseModule, PactService],
})
export class PactModule {}
