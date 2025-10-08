import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(280)
  content!: string;

  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true, message: 'media must be valid URLs' })
  @IsOptional()
  media?: string[];

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(80, { each: true })
  @IsOptional()
  pollOptions?: string[];
}
