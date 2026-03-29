// users/entities/user.entity.ts
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export interface User {
  id: string;
  login: string;
  password: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}

export interface CreateUserDto {
  login: string;
  password: string;
  role?: 'admin' | 'editor' | 'viewer'; // defaults to 'viewer'
}

export interface UpdatePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export type PublicUser = Omit<User, 'password'>;
