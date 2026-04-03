import { IsUUID } from 'class-validator';

export class GetCommentsQueryDto {
  @IsUUID()
  articleId: string;
}
