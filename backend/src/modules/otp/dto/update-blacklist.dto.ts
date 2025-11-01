import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const TYPES = ['phone', 'ip'] as const;

export class UpdateBlacklistDto {
  @IsIn(TYPES)
  type!: (typeof TYPES)[number];

  @IsString()
  @Length(3, 64)
  value!: string;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  note?: string;
}

export class RemoveBlacklistDto {
  @IsIn(TYPES)
  type!: (typeof TYPES)[number];

  @IsString()
  @Length(3, 64)
  value!: string;
}
