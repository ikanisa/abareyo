import { IsEnum } from 'class-validator';

type ModerationStatus = 'published' | 'removed';

export class ModeratePostDto {
  @IsEnum(['published', 'removed'], { message: 'status must be published or removed' })
  status!: ModerationStatus;
}
