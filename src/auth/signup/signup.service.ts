import { Injectable } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { UsersService } from 'src/users/users.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ValidationError } from '../../common/errors/validation.error';

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
        throw new ValidationError('Login is already taken');
      }

      throw error;
    }
  }
}
