import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @MinLength(1)
  login: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.viewer })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
