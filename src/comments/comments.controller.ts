import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { Comment } from './entities/comment.entity';
import { CommentsService } from './comments.service';
import { PaginatedResponse } from '../common/pagination/paginated-response.type';

@Controller('comment')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getByArticleId(
    @Query() queryDto: GetCommentsQueryDto,
  ): Promise<Comment[] | PaginatedResponse<Comment>> {
    return this.commentsService.getByArticleId(queryDto);
  }

  @Get(':id')
  async getOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Comment> {
    return this.commentsService.getOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCommentDto): Promise<Comment> {
    return this.commentsService.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.commentsService.delete(id);
  }
}
