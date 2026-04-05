import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUser, User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { toPublicUser } from '../helpers/toPublicUser';
import { UsersRepository } from './users.repository';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ArticlesService } from '../articles/articles.service';
import { CommentsService } from '../comments/comments.service';
import { PaginatedResponse } from '../common/pagination/paginated-response.type';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { paginate } from '../common/pagination/paginate.util';
import { SortOrder } from '../common/pagination/sort-order.enum';
import { UserSortBy } from './enums/user-sorting.enum';

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

  getAll(
    queryDto: GetUsersQueryDto,
  ): PublicUser[] | PaginatedResponse<PublicUser> {
    const users = [...this.usersRepository.getAll()];

    const hasPagination =
      queryDto.page !== undefined || queryDto.limit !== undefined;

    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 10;
    const sortBy = queryDto.sortBy ?? UserSortBy.CREATED_AT;
    const order = queryDto.order ?? SortOrder.DESC;

    users.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case UserSortBy.LOGIN:
          compareResult = a.login.localeCompare(b.login);
          break;
        case UserSortBy.ROLE:
          compareResult = a.role.localeCompare(b.role);
          break;
        case UserSortBy.CREATED_AT:
          compareResult = a.createdAt - b.createdAt;
          break;
        case UserSortBy.UPDATED_AT:
          compareResult = a.updatedAt - b.updatedAt;
          break;
      }

      return order === SortOrder.ASC ? compareResult : -compareResult;
    });

    const publicUsers = users.map(toPublicUser);

    return hasPagination ? paginate(publicUsers, page, limit) : publicUsers;
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
