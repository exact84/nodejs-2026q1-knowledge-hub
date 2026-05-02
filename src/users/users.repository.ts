import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { User } from './entities/user.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(user: {
    id: string;
    login: string;
    password: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      login: user.login,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime(),
    };
  }

  async create(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        login: user.login,
        password: user.password,
        role: user.role,
      },
    });

    return this.mapToEntity(createdUser);
  }

  async getAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.mapToEntity(user));
  }

  async getOne(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.mapToEntity(user) : null;
  }

  async getByLogin(login: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { login },
    });

    return user ? this.mapToEntity(user) : null;
  }

  async update(user: User): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        login: user.login,
        password: user.password,
        role: user.role,
      },
    });

    return this.mapToEntity(updatedUser);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
