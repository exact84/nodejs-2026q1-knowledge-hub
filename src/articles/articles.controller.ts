import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { Article, PaginatedArticlesResponse } from './entities/article.entity';
import { GetArticlesQueryDto } from './dto/get-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('article')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  create(@Body() dto: CreateArticleDto): Article {
    return this.articlesService.create(dto);
  }

  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe()) id: string): Article {
    return this.articlesService.getOne(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateArticleDto,
  ): Article {
    return this.articlesService.update(id, dto);
  }

  @Get()
  getAll(
    @Query() queryDto: GetArticlesQueryDto,
  ): Article[] | PaginatedArticlesResponse {
    return this.articlesService.getAll(queryDto);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', new ParseUUIDPipe()) id: string): void {
    this.articlesService.delete(id);
  }
}
