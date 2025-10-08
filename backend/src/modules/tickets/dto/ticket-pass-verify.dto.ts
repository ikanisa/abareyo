import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class TicketPassVerifyDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsUUID()
  @IsOptional()
  stewardId?: string;
}
