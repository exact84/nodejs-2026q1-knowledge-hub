import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUser, User } from './entities/user.entity';
import { UserRole } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginatedResponse } from '../common/pagination/paginated-response.type';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { paginate } from '../common/pagination/paginate.util';
import { SortOrder } from '../common/pagination/sort-order.enum';
import { UserSortBy } from './enums/user-sorting.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const passwordSaltRounds = Number(process.env.CRYPT_SALT);

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      passwordSaltRounds,
    );

    const savedUser = await this.usersRepository.create({
      login: createUserDto.login,
      password: hashedPassword,
      role: createUserDto.role ?? UserRole.viewer,
    });

    return savedUser;
  }

  async getAll(
    queryDto: GetUsersQueryDto,
  ): Promise<PublicUser[] | PaginatedResponse<PublicUser>> {
    const users = [...(await this.usersRepository.getAll())];

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

    return hasPagination ? paginate(users, page, limit) : users;
  }

  async getOne(id: string): Promise<PublicUser> {
    const user = await this.usersRepository.getOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async getByLogin(login: string): Promise<User | null> {
    return this.usersRepository.getByLogin(login);
  }

  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<PublicUser> {
    const user = await this.usersRepository.getOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const isMatch = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );

    if (!isMatch) {
      throw new ForbiddenException('Old password is wrong');
    }

    const passwordSaltRounds = Number(process.env.CRYPT_SALT);

    const hashedPassword = await bcrypt.hash(
      updatePasswordDto.newPassword,
      passwordSaltRounds,
    );

    const updatedUser: User = {
      ...user,
      password: hashedPassword,
    };

    const savedUser = await this.usersRepository.update(updatedUser);

    return savedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await this.usersRepository.getOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.usersRepository.delete(id);
  }
}
