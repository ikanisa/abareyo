import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class QuizSubmissionDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(60)
  quizId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  answer!: string;
}
