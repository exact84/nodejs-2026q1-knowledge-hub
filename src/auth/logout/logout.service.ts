import { Injectable } from '@nestjs/common';
import { LogoutDto } from './dto/logout.dto';
import { Logout } from './entities/logout.entity';
import { UsersService } from 'src/users/users.service';
import { TokensService } from 'src/auth/tokens/tokens.service';
import { ForbiddenError } from '../../common/errors/forbidden.error';
import { UnauthorizedError } from '../../common/errors/unauthorized.error';

@Injectable()
export class LogoutService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async logout(logoutDto: LogoutDto): Promise<Logout> {
    if (!logoutDto?.refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const payload = await this.tokensService.verifyRefreshToken(
      logoutDto.refreshToken,
    );
    const user = await this.usersService.getByLogin(payload.login);

    if (!user || user.id !== payload.userId) {
      throw new ForbiddenError('Refresh token is invalid or expired');
    }

    this.tokensService.revokeRefreshToken(logoutDto.refreshToken);

    return {
      success: true,
    };
  }
}
