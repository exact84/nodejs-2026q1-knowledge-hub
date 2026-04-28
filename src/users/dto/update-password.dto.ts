import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'OldP@ssw0rd' })
  @IsString()
  @MinLength(1)
  oldPassword: string;

  @ApiProperty({ example: 'NewStr0ngP@ssw0rd' })
  @IsString()
  @MinLength(1)
  newPassword: string;
}
