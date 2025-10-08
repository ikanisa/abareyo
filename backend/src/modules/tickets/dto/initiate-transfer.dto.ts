import { IsOptional, IsString, IsUUID } from 'class-validator';

export class InitiateTransferDto {
  @IsUUID()
  passId!: string;

  @IsUUID()
  ownerUserId!: string;

  @IsUUID()
  @IsOptional()
  targetUserId?: string;

  @IsString()
  @IsOptional()
  targetPhone?: string;
}
