import { IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class SchedulePredictionDto {
  @IsUUID()
  matchId!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(280)
  question!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  rewardPoints?: number;

  @IsDateString()
  deadline!: string;
}
