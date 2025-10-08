import { IsOptional, IsString, IsUUID } from 'class-validator';

export class VotePollDto {
  @IsUUID()
  pollId!: string;

  @IsUUID()
  optionId!: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
