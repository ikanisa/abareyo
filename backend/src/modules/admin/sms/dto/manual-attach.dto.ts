import { IsUUID } from 'class-validator';

export class ManualAttachDto {
  @IsUUID()
  smsId!: string;

  @IsUUID()
  paymentId!: string;
}
