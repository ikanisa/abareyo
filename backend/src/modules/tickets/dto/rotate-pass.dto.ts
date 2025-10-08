import { IsNotEmpty, IsString } from 'class-validator';

export class RotatePassDto {
  @IsString()
  @IsNotEmpty()
  passId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;
}
