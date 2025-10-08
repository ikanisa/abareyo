import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class PredictionDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  matchId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  pick!: string;
}
