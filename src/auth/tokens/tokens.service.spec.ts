import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokensService } from './tokens.service';

describe('TokensService', () => {
  let service: TokensService;
  let jwtService: Pick<JwtService, 'signAsync' | 'verifyAsync' | 'decode'>;

  beforeEach(() => {
    process.env.JWT_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_TTL = '7d';

    jwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
      decode: vi.fn(),
    };

    service = new TokensService(jwtService as JwtService);
  });

  it('generates an access and refresh token pair', async () => {
    vi.mocked(jwtService.signAsync)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.generateTokenPair({
      userId: 'user-1',
      login: 'alice',
      role: UserRole.admin,
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      {
        userId: 'user-1',
        login: 'alice',
        role: UserRole.admin,
      },
      {
        secret: 'access-secret',
        expiresIn: '15m',
      },
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      {
        userId: 'user-1',
        login: 'alice',
        role: UserRole.admin,
      },
      {
        secret: 'refresh-secret',
        expiresIn: '7d',
      },
    );
  });

  it('rejects a revoked refresh token', async () => {
    vi.mocked(jwtService.decode).mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    service.revokeRefreshToken('refresh-token');

    await expect(service.verifyRefreshToken('refresh-token')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('maps access token verification failures to unauthorized', async () => {
    vi.mocked(jwtService.verifyAsync).mockRejectedValue(new Error('bad token'));

    await expect(service.verifyAccessToken('broken')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('maps refresh token verification failures to forbidden', async () => {
    vi.mocked(jwtService.verifyAsync).mockRejectedValue(new Error('bad token'));

    await expect(
      service.verifyRefreshToken('broken-refresh-token'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('adds a refresh token to revoked tokens with current timestamp', () => {
    const refreshToken = 'test-refresh-token';

    service.revokeRefreshToken(refreshToken);

    expect(
      service['revokedRefreshTokens'].get(refreshToken),
    ).toBeLessThanOrEqual(Date.now());
  });

  it('removes expired tokens during cleanup', () => {
    const expiredToken = 'expired-token';
    const validToken = 'valid-token';
    const now = Date.now();

    service['revokedRefreshTokens'].set(expiredToken, now - 1000);
    service['revokedRefreshTokens'].set(validToken, now + 1000);

    service['cleanupRevokedRefreshTokens']();

    expect(service['revokedRefreshTokens'].has(expiredToken)).toBe(false);
    expect(service['revokedRefreshTokens'].has(validToken)).toBe(true);
  });
});
