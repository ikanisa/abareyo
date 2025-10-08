import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { MatchStatus } from '@prisma/client';

export class CreateMatchDto {
  @IsString()
  @MinLength(2)
  opponent!: string;

  @IsDateString()
  kickoff!: string;

  @IsString()
  @MinLength(2)
  venue!: string;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @IsOptional()
  @IsString()
  competition?: string;
}
