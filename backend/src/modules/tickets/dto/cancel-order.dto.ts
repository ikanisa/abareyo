import { IsUUID } from 'class-validator';

export class CancelTicketOrderDto {
  @IsUUID()
  userId!: string;
}
