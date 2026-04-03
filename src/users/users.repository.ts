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

  update(user: User): User {
    const index = this.users.findIndex(
      (currentUser) => currentUser.id === user.id,
    );

    this.users[index] = user;
    return user;
  }

  delete(id: string): void {
    this.users = this.users.filter((user) => user.id !== id);
  }
}
