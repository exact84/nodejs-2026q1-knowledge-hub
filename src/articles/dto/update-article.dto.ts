import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ArticleStatus } from '../enums/article-status.enum';

export class UpdateArticleDto {
  @ApiProperty({ example: 'NestJS Guide', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiProperty({ example: 'This is an article about NestJS', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiProperty({
    required: false,
    enum: ArticleStatus,
    example: ArticleStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  authorId?: string | null;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiProperty({
    type: [String],
    example: ['nestjs', 'backend'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
