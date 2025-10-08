import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePromptDto {
  @IsString()
  @MinLength(3)
  label!: string;

  @IsString()
  @MinLength(20)
  body!: string;

  @IsOptional()
  version?: number;
}
