import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  postId!: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  content!: string;
}
