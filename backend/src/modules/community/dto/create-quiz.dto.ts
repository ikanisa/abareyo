import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @MinLength(8)
  @MaxLength(280)
  prompt!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  correctAnswer!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  rewardPoints?: number;

  @IsDateString()
  @IsOptional()
  activeFrom?: string;

  @IsDateString()
  @IsOptional()
  activeUntil?: string;
}
