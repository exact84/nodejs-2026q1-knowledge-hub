import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RefreshDto } from './dto/refresh.dto';
import { Refresh } from './entities/refresh.entity';
import { TokensService } from 'src/auth/tokens/tokens.service';

@Injectable()
export class RefreshService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async refresh(refreshDto: RefreshDto): Promise<Refresh> {
    if (!refreshDto?.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = await this.tokensService.verifyRefreshToken(
      refreshDto.refreshToken,
    );

    const user = await this.usersService.getByLogin(payload.login);

    if (!user || user.id !== payload.userId) {
      throw new ForbiddenException('Refresh token is invalid or expired');
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
