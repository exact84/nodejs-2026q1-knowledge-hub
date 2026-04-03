import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUser, User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { toPublicUser } from 'src/helpers/toPublicUser';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

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

    this.userRepository.create(newUser);

    return toPublicUser(newUser);
  }

  getAll(): PublicUser[] {
    const result = this.userRepository.getAll().map(toPublicUser);
    return result;
  }

  getOne(id: string): PublicUser {
    const user = this.userRepository.getOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return toPublicUser(user);
  }
}
