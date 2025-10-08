import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SmsWebhookDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsString()
  @IsOptional()
  receivedAt?: string;
}

export interface SmsWebhookMeta {
  modemId: string;
  simSlot: string;
}

export class SmsManualAttachDto {
  @IsString()
  @IsNotEmpty()
  smsId!: string;

  @IsString()
  @IsNotEmpty()
  paymentId!: string;
}
