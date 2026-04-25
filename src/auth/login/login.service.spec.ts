import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginService } from './login.service';
import { UsersService } from 'src/users/users.service';
import { TokensService } from 'src/auth/tokens/tokens.service';
import * as bcrypt from 'bcryptjs';

describe('LoginService', () => {
  let service: LoginService;
  let usersService: Pick<UsersService, 'getByLogin'>;
  let tokensService: Pick<TokensService, 'generateTokenPair'>;

  beforeEach(() => {
    usersService = {
      getByLogin: vi.fn(),
    };
    tokensService = {
      generateTokenPair: vi.fn(),
    };
    service = new LoginService(
      usersService as UsersService,
      tokensService as TokensService,
    );
  });

  it('logs in a user with valid credentials', async () => {
    vi.mocked(usersService.getByLogin).mockResolvedValue({
      id: 'user-1',
      login: 'alice',
      password: await bcrypt.hash('password', 10),
      role: 'admin',
      createdAt: 0,
      updatedAt: 0,
    });
    vi.mocked(tokensService.generateTokenPair).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await service.login({
      login: 'alice',
      password: 'password',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('throws an exception for invalid login', async () => {
    vi.mocked(usersService.getByLogin).mockResolvedValue(null);

    await expect(
      service.login({ login: 'alice', password: 'password' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws an exception for invalid password', async () => {
    vi.mocked(usersService.getByLogin).mockResolvedValue({
      id: 'user-1',
      login: 'alice',
      password: await bcrypt.hash('password', 10),
      role: 'admin',
      createdAt: 0,
      updatedAt: 0,
    });

    await expect(
      service.login({ login: 'alice', password: 'wrong-password' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
