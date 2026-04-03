import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  private users: User[] = [];

  create(user: User): User {
    this.users.push(user);
    return user;
  }

  getAll(): User[] {
    return this.users;
  }

  getOne(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }
}
