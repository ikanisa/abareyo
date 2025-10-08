import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CheckInDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  location?: string;
}
