import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshService } from './refresh.service';
import { UsersService } from 'src/users/users.service';
import { TokensService } from 'src/auth/tokens/tokens.service';
import { UserRole } from '@prisma/client';

describe('RefreshService', () => {
  let service: RefreshService;
  let usersService: Pick<UsersService, 'getByLogin'>;
  let tokensService: Pick<
    TokensService,
    'verifyRefreshToken' | 'generateTokenPair' | 'revokeRefreshToken'
  >;

  beforeEach(() => {
    usersService = {
      getByLogin: vi.fn(),
    };
    tokensService = {
      verifyRefreshToken: vi.fn(),
      generateTokenPair: vi.fn(),
      revokeRefreshToken: vi.fn(),
    };
    service = new RefreshService(
      usersService as UsersService,
      tokensService as TokensService,
    );
  });

  it('refreshes tokens with a valid refresh token', async () => {
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
    vi.mocked(tokensService.generateTokenPair).mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const result = await service.refresh({
      refreshToken: 'valid-refresh-token',
    });

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    expect(tokensService.revokeRefreshToken).toHaveBeenCalledWith(
      'valid-refresh-token',
    );
  });

  it('throws an exception if refresh token is missing', async () => {
    await expect(service.refresh({ refreshToken: '' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws an exception for invalid refresh token', async () => {
    vi.mocked(tokensService.verifyRefreshToken).mockRejectedValue(
      new ForbiddenException('Invalid token'),
    );

    await expect(
      service.refresh({ refreshToken: 'invalid-refresh-token' }),
    ).rejects.toThrow(ForbiddenException);
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
      service.refresh({ refreshToken: 'valid-refresh-token' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
