import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto validation', () => {
  it('fails when login is missing', async () => {
    const dto = plainToInstance(CreateUserDto, {
      password: 'secret',
    });

    const errors = await validate(dto);
    const hasLoginError = errors.some((error) => error.property === 'login');

    expect(hasLoginError).toBe(true);
  });

  it('fails when password is missing', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'alice',
    });

    const errors = await validate(dto);
    const hasPasswordError = errors.some(
      (error) => error.property === 'password',
    );

    expect(hasPasswordError).toBe(true);
  });

  it('fails when role enum is invalid', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'alice',
      password: 'secret',
      role: 'superadmin',
    });

    const errors = await validate(dto);
    const hasRoleError = errors.some((error) => error.property === 'role');

    expect(hasRoleError).toBe(true);
  });

  it('passes for valid payload with explicit role', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'alice',
      password: 'secret',
      role: UserRole.viewer,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes for valid payload without optional role', async () => {
    const dto = plainToInstance(CreateUserDto, {
      login: 'alice',
      password: 'secret',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
