import { IsEnum, IsString, IsUUID } from 'class-validator';

export class MembershipUpgradeDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  planId!: string;

  @IsEnum(['mtn', 'airtel'], {
    message: 'channel must be mtn or airtel',
  })
  channel!: 'mtn' | 'airtel';
}
