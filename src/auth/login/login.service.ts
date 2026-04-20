import { ForbiddenException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { Login } from './entities/login.entity';
import { TokensService } from 'src/auth/tokens/tokens.service';

@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async login(loginDto: LoginDto): Promise<Login> {
    const user = await this.usersService.getByLogin(loginDto.login);

    if (!user) {
      throw new ForbiddenException('Authentication failed');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException('Authentication failed');
    }

    const payload = {
      userId: user.id,
      login: user.login,
      role: user.role,
    };

    return this.tokensService.generateTokenPair(payload);
  }
}
