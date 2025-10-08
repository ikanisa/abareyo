import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class ParserTestDto {
  @IsString()
  @MinLength(3)
  text!: string;

  @IsOptional()
  @IsUUID()
  promptId?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  promptBody?: string;
}
