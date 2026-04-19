import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { RefreshDto } from './dto/refresh.dto';
import { Refresh } from './entities/refresh.entity';

interface RefreshTokenPayload {
  userId: string;
  login: string;
  role: string;
}

@Injectable()
export class RefreshService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async refresh(refreshDto: RefreshDto): Promise<Refresh> {
    if (!refreshDto?.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshDto.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );
    } catch {
      throw new ForbiddenException('Refresh token is invalid or expired');
    }

    const user = await this.usersService.getByLogin(payload.login);

    if (!user || user.id !== payload.userId) {
      throw new ForbiddenException('Refresh token is invalid or expired');
    }

    const nextPayload = {
      userId: user.id,
      login: user.login,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(nextPayload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_TTL,
      }),
      this.jwtService.signAsync(nextPayload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_TTL,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
