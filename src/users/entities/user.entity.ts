import { UserRole } from '@prisma/client';

export interface User {
  id: string;
  login: string;
  password: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}

export type PublicUser = Omit<User, 'password'>;
