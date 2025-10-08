import { IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class DonateDto {
  @IsUUID()
  projectId!: string;

  @IsInt()
  @IsPositive()
  amount!: number;

  @IsEnum(['mtn', 'airtel'], { message: 'channel must be mtn or airtel' })
  channel!: 'mtn' | 'airtel';

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  donorName?: string;
}
