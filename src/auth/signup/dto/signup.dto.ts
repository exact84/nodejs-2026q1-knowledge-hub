import { PickType } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

export class SignupDto extends PickType(CreateUserDto, [
  'login',
  'password',
] as const) {}
