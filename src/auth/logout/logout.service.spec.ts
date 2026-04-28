import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutService } from './logout.service';
import { UsersService } from 'src/users/users.service';
import { TokensService } from 'src/auth/tokens/tokens.service';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '../../common/errors/forbidden.error';
import { UnauthorizedError } from '../../common/errors/unauthorized.error';

describe('LogoutService', () => {
  let service: LogoutService;
  let usersService: Pick<UsersService, 'getByLogin'>;
  let tokensService: Pick<
    TokensService,
    'verifyRefreshToken' | 'revokeRefreshToken'
  >;

  beforeEach(() => {
    usersService = {
      getByLogin: vi.fn(),
    };
    tokensService = {
      verifyRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
    };
    service = new LogoutService(
      usersService as UsersService,
      tokensService as TokensService,
    );
  });

  it('logs out a user with a valid refresh token', async () => {
    vi.mocked(tokensService.verifyRefreshToken).mockResolvedValue({
      userId: 'user-1',
      login: 'alice',
      role: 'admin',
    });
    vi.mocked(usersService.getByLogin).mockResolvedValue({
      id: 'user-1',
      login: 'alice',
      password: 'hashed-password',
      role: UserRole.viewer,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const result = await service.logout({
      refreshToken: 'valid-refresh-token',
    });

    expect(result).toEqual({ success: true });
    expect(tokensService.revokeRefreshToken).toHaveBeenCalledWith(
      'valid-refresh-token',
    );
  });

  it('throws an exception if refresh token is missing', async () => {
    await expect(service.logout({ refreshToken: '' })).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('throws an exception for invalid refresh token', async () => {
    vi.mocked(tokensService.verifyRefreshToken).mockRejectedValue(
      new ForbiddenError('Invalid token'),
    );

    await expect(
      service.logout({ refreshToken: 'invalid-refresh-token' }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws an exception if user does not match payload', async () => {
    vi.mocked(tokensService.verifyRefreshToken).mockResolvedValue({
      userId: 'user-1',
      login: 'alice',
      role: 'admin',
    });
    vi.mocked(usersService.getByLogin).mockResolvedValue({
      id: 'user-2',
      login: 'alice',
      password: 'hashed-password',
      role: UserRole.viewer,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await expect(
      service.logout({ refreshToken: 'valid-refresh-token' }),
    ).rejects.toThrow(ForbiddenError);
  });
});
