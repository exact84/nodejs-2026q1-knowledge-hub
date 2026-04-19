import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';

export interface AuthTokenPayload {
  userId: string;
  login: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokensService {
  private readonly revokedRefreshTokens = new Map<string, number>();

  constructor(private readonly jwtService: JwtService) {}

  async generateTokenPair(payload: AuthTokenPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_TTL,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_TTL,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyRefreshToken(refreshToken: string): Promise<AuthTokenPayload> {
    this.cleanupRevokedRefreshTokens();

    if (this.revokedRefreshTokens.has(refreshToken)) {
      throw new ForbiddenException('Refresh token is invalid or expired');
    }

    try {
      return await this.jwtService.verifyAsync<AuthTokenPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new ForbiddenException('Refresh token is invalid or expired');
    }
  }

  revokeRefreshToken(refreshToken: string): void {
    this.cleanupRevokedRefreshTokens();

    const decodedToken = this.jwtService.decode(refreshToken);

    if (
      decodedToken &&
      typeof decodedToken === 'object' &&
      'exp' in decodedToken &&
      typeof decodedToken.exp === 'number'
    ) {
      this.revokedRefreshTokens.set(refreshToken, decodedToken.exp * 1000);
      return;
    }

    this.revokedRefreshTokens.set(refreshToken, Date.now());
  }

  private cleanupRevokedRefreshTokens(): void {
    const now = Date.now();

    for (const [token, expiresAt] of this.revokedRefreshTokens.entries()) {
      if (expiresAt <= now) {
        this.revokedRefreshTokens.delete(token);
      }
    }
  }
}
