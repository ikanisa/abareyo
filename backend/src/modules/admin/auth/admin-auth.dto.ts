import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class AdminSupabaseLoginDto {
  @IsString()
  accessToken!: string;
}
