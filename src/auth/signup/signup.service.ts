import { BadRequestException, Injectable } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { UsersService } from 'src/users/users.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class SignupService {
  constructor(private readonly userService: UsersService) {}

  async signup(signupDto: SignupDto) {
    try {
      return await this.userService.create(signupDto);
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Login is already taken');
      }

      throw error;
    }
  }
}
