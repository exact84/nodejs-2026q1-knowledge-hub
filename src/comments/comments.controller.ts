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
  getByArticleId(
    @Query() queryDto: GetCommentsQueryDto,
  ): Comment[] | PaginatedResponse<Comment> {
    return this.commentsService.getByArticleId(queryDto);
  }

  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe()) id: string): Comment {
    return this.commentsService.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateCommentDto): Comment {
    return this.commentsService.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', new ParseUUIDPipe()) id: string): void {
    this.commentsService.delete(id);
  }
}
