import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @MinLength(1)
  login: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiProperty({ required: false, enum: UserRole, example: UserRole.VIEWER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
