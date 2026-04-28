import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RefreshDto } from './dto/refresh.dto';
import { Refresh } from './entities/refresh.entity';
import { TokensService } from 'src/auth/tokens/tokens.service';
import { ForbiddenError } from '../../common/errors/forbidden.error';
import { UnauthorizedError } from '../../common/errors/unauthorized.error';

@Injectable()
export class RefreshService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async refresh(refreshDto: RefreshDto): Promise<Refresh> {
    if (!refreshDto?.refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const payload = await this.tokensService.verifyRefreshToken(
      refreshDto.refreshToken,
    );

    const user = await this.usersService.getByLogin(payload.login);

    if (!user || user.id !== payload.userId) {
      throw new ForbiddenError('Refresh token is invalid or expired');
    }

    const nextPayload = {
      userId: user.id,
      login: user.login,
      role: user.role,
    };

    this.tokensService.revokeRefreshToken(refreshDto.refreshToken);

    return this.tokensService.generateTokenPair(nextPayload);
  }
}
