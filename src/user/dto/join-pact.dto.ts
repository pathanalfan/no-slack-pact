import { IsMongoId, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class JoinPactDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string; // User who wants to join the pact

  @IsMongoId()
  @IsNotEmpty()
  pactId: string; // Pact to join

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @IsNotEmpty()
  activityIds: string[]; // Array of activity IDs the user will perform (first is primary, second is secondary)
}

