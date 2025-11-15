import { IsOptional, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class PactDetailsDto {
  @IsMongoId()
  @IsOptional()
  pactId?: string | Types.ObjectId;

  @IsMongoId()
  @IsOptional()
  primaryActivityId?: string | Types.ObjectId;

  @IsMongoId()
  @IsOptional()
  secondaryActivityId?: string | Types.ObjectId;
}

