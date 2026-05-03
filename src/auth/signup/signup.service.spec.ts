import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignupService } from './signup.service';
import { UsersService } from 'src/users/users.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ValidationError } from '../../common/errors/validation.error';

describe('SignupService', () => {
  let service: SignupService;
  let usersService: Pick<UsersService, 'create'>;

  beforeEach(() => {
    usersService = {
      create: vi.fn(),
    };
    service = new SignupService(usersService as UsersService);
  });

  it('signs up a new user', async () => {
    vi.mocked(usersService.create).mockResolvedValue({
      id: 'user-1',
      login: 'alice',
      role: 'admin',
      createdAt: 0,
      updatedAt: 0,
    });

    const result = await service.signup({
      login: 'alice',
      password: 'password',
    });

    expect(result).toEqual({
      id: 'user-1',
      login: 'alice',
      role: 'admin',
      createdAt: 0,
      updatedAt: 0,
    });
  });

  it('throws an exception if login is already taken', async () => {
    vi.mocked(usersService.create).mockRejectedValue(
      new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
      }),
    );

    await expect(
      service.signup({ login: 'alice', password: 'password' }),
    ).rejects.toThrow(ValidationError);
  });

  it('rethrows unexpected errors', async () => {
    const unexpectedError = new Error('Unexpected error');
    vi.mocked(usersService.create).mockRejectedValue(unexpectedError);

    await expect(
      service.signup({ login: 'alice', password: 'password' }),
    ).rejects.toThrow(unexpectedError);
  });
});
