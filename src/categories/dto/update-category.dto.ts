import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Backend' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 'Articles about backend development and architecture',
  })
  @IsString()
  @MinLength(1)
  description: string;
}
