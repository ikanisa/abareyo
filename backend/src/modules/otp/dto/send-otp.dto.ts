import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const ALLOWED_CHANNELS = ['whatsapp'] as const;

export class SendOtpDto {
  @IsString()
  @Length(4, 64)
  phone!: string;

  @IsOptional()
  @IsIn(ALLOWED_CHANNELS)
  channel?: (typeof ALLOWED_CHANNELS)[number];

  @IsOptional()
  @IsString()
  @Length(2, 8)
  locale?: string;
}
