import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  ParseUUIDPipe,
  Delete,
  HttpCode,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UsersService } from './users.service';
import { PublicUser } from './entities/user.entity';
import { PaginatedResponse } from '../common/pagination/paginated-response.type';
import { GetUsersQueryDto } from './dto/get-users-query.dto';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<PublicUser> {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  async getOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PublicUser> {
    return this.usersService.getOne(id);
  }

  @Get()
  async getAll(
    @Query() queryDto: GetUsersQueryDto,
  ): Promise<PublicUser[] | PaginatedResponse<PublicUser>> {
    return this.usersService.getAll(queryDto);
  }

  @Put(':id')
  async updatePassword(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<PublicUser> {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
