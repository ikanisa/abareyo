import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

const REACTION_KINDS = ['like', 'cheer', 'love'] as const;
export type ReactionKind = typeof REACTION_KINDS[number];

export class ReactPostDto {
  @IsUUID()
  postId!: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsIn(REACTION_KINDS)
  kind!: ReactionKind;
}

export const SupportedReactionKinds = REACTION_KINDS;
