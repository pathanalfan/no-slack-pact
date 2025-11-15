import { IsMongoId, IsNumber, IsBoolean, IsNotEmpty, IsString, IsOptional, Min } from 'class-validator';

export class CreateActivityDto {
  @IsMongoId()
  @IsNotEmpty()
  pactId: string; // The pact ID the activity is related to

  @IsMongoId()
  @IsNotEmpty()
  userId: string; // User who is creating the activity

  @IsString()
  @IsNotEmpty()
  name: string; // Name of the activity

  @IsString()
  @IsOptional()
  description?: string; // Description of the activity

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  numberOfDays: number; // Number of days performing that activity

  @IsBoolean()
  @IsNotEmpty()
  isPrimary: boolean; // Whether that activity is primary
}

