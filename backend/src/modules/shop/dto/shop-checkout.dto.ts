import { ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class ShopCheckoutItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class ShopCheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  items!: ShopCheckoutItemDto[];

  @IsEnum(['mtn', 'airtel'], { message: 'channel must be mtn or airtel' })
  channel!: 'mtn' | 'airtel';

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
}
