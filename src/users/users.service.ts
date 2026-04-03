import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUser, User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { toPublicUser } from 'src/helpers/toPublicUser';
import { UsersRepository } from './users.repository';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ArticlesService } from 'src/articles/articles.service';
import { CommentsService } from 'src/comments/comments.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly articlesService: ArticlesService,
    private readonly commentsService: CommentsService,
  ) {}

  create(createUserDto: CreateUserDto): PublicUser {
    const timestamp = Date.now();

    const newUser: User = {
      id: randomUUID(),
      login: createUserDto.login,
      password: createUserDto.password,
      role: createUserDto.role ?? UserRole.VIEWER,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.usersRepository.create(newUser);

    return toPublicUser(newUser);
  }

  getAll(): PublicUser[] {
    const result = this.usersRepository.getAll().map(toPublicUser);
    return result;
  }

  getOne(id: string): PublicUser {
    const user = this.usersRepository.getOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return toPublicUser(user);
  }

  updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): PublicUser {
    const user = this.usersRepository.getOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenException('Old password is wrong');
    }

    const updatedUser: User = {
      ...user,
      password: updatePasswordDto.newPassword,
      updatedAt: Date.now(),
    };

    const savedUser = this.usersRepository.update(updatedUser);

    return toPublicUser(savedUser);
  }

  delete(id: string): void {
    const user = this.usersRepository.getOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.articlesService.clearAuthorId(id);
    this.commentsService.deleteByAuthorId(id);
    this.usersRepository.delete(id);
  }
}
