import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsInt()
  @Min(0)
  capacity!: number;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  gate?: string;
}
