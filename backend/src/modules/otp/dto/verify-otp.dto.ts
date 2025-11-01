import { IsOptional, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Length(4, 64)
  phone!: string;

  @IsString()
  @Length(3, 12)
  code!: string;

  @IsOptional()
  @IsString()
  @Length(2, 8)
  locale?: string;
}
