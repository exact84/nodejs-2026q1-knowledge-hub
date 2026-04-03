import { User, PublicUser } from 'src/users/entities/user.entity';

export function toPublicUser(user: User): PublicUser {
  const result = { ...user };
  delete result.password;
  return result;
}
