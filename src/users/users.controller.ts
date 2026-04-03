import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UsersService } from './users.service';
import { PublicUser } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): PublicUser {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe()) id: string): PublicUser | undefined {
    return this.usersService.getOne(id);
  }

  @Get()
  getAll(): PublicUser[] {
    return this.usersService.getAll();
  }

  @Put(':id')
  updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): { id: string; body: UpdatePasswordDto } {
    return {
      id,
      body: updatePasswordDto,
    };
  }
}
