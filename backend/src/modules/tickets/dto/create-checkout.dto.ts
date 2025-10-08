import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export enum TicketZone {
  VIP = 'VIP',
  REGULAR = 'REGULAR',
  GENERAL = 'GENERAL',
}

export class TicketCheckoutItemDto {
  @IsEnum(TicketZone)
  zone!: TicketZone;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsInt()
  @Min(1000)
  price!: number;
}

export class TicketCheckoutDto {
  @IsUUID()
  matchId!: string;

  @IsArray()
  @ArrayMinSize(1)
  items!: TicketCheckoutItemDto[];

  @IsString()
  @IsOptional()
  channel?: 'mtn' | 'airtel';

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  contactName?: string;

  @IsString()
  @Matches(/^[0-9+]{9,15}$/)
  @IsOptional()
  contactPhone?: string;
}
