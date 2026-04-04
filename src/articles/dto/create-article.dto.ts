import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ArticleStatus } from '../enums/article-status.enum';

export class CreateArticleDto {
  @ApiProperty({ example: 'NestJS Guide' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: 'This is an article about NestJS' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    enum: ArticleStatus,
    example: ArticleStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  authorId?: string | null;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['nestjs', 'backend'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
