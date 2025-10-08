import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateGateDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxThroughput?: number;
}
