import { IsString, IsUUID, Length } from 'class-validator';

export class ClaimTransferDto {
  @IsUUID()
  passId!: string;

  @IsUUID()
  recipientUserId!: string;

  @IsString()
  @Length(6, 6)
  transferCode!: string;
}
