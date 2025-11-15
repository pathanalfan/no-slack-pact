import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePactDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsNumber()
  @Min(1)
  @Max(7)
  @IsNotEmpty()
  minDaysPerWeek: number; // Minimum number of days activities need to be performed in a week (1-7)

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  maxActivitiesPerUser: number; // Maximum number of activities performed per user

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  skipFine: number; // Fine amount for skipping an activity

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  leaveFine: number; // Fine amount for leaving the pact
}

