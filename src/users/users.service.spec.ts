import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';
import { UserSortBy } from './enums/user-sorting.enum';
import { SortOrder } from '../common/pagination/sort-order.enum';
import { ForbiddenError } from '../common/errors/forbidden.error';
import { NotFoundError } from '../common/errors/not-found.error';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));

function createUser(
  overrides: Partial<User> & Pick<User, 'id' | 'login' | 'password'>,
): User {
  return {
    role: UserRole.viewer,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let repository: Pick<
    UsersRepository,
    'create' | 'getAll' | 'getOne' | 'update' | 'delete' | 'getByLogin'
  >;

  beforeEach(async () => {
    process.env.CRYPT_SALT = '10';

    repository = {
      create: vi.fn(),
      getAll: vi.fn().mockResolvedValue([
        createUser({
          id: '1',
          login: 'charlie',
          password: 'secret-1',
          createdAt: 300,
          updatedAt: 300,
          role: UserRole.editor,
        }),
        createUser({
          id: '2',
          login: 'alice',
          password: 'secret-2',
          createdAt: 100,
          updatedAt: 200,
          role: UserRole.viewer,
        }),
      ]),
      getOne: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getByLogin: vi.fn(),
    };

    vi.mocked(bcrypt.hash).mockReset();
    vi.mocked(bcrypt.compare).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('hashes password and returns created user on create', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    vi.mocked(repository.create).mockImplementation(async (user) =>
      createUser({
        id: 'created',
        login: user.login,
        password: user.password,
        role: user.role,
      }),
    );

    const result = await service.create({
      login: 'new-user',
      password: 'plain-password',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
    expect(repository.create).toHaveBeenCalledWith({
      login: 'new-user',
      password: 'hashed-password',
      role: UserRole.viewer,
    });
    expect(result).toEqual({
      id: 'created',
      login: 'new-user',
      password: 'hashed-password',
      role: UserRole.viewer,
      createdAt: 0,
      updatedAt: 0,
    });
  });

  it('returns paginated users sorted by login', async () => {
    const result = await service.getAll({
      sortBy: UserSortBy.LOGIN,
      order: SortOrder.ASC,
      page: 1,
      limit: 1,
    });

    expect(Array.isArray(result)).toBe(false);
    if (!Array.isArray(result)) {
      expect(result.data.map((user) => user.login)).toEqual(['alice']);
      expect(result.data[0]).toHaveProperty('password');
    }
  });

  it('sorts by role', async () => {
    const result = await service.getAll({
      sortBy: UserSortBy.ROLE,
      order: SortOrder.ASC,
    });

    if (!Array.isArray(result)) throw new Error();

    expect(result.map((u) => u.role)).toEqual([
      UserRole.editor,
      UserRole.viewer,
    ]);
  });

  it('sorts by createdAt', async () => {
    const result = await service.getAll({
      page: 1,
      limit: 10,
    });

    if (Array.isArray(result)) throw new Error();

    expect(result.data.map((u) => u.createdAt)).toEqual([300, 100]);
  });

  it('sorts by updatedAt', async () => {
    const result = await service.getAll({
      sortBy: UserSortBy.UPDATED_AT,
      order: SortOrder.ASC,
      page: 1,
      limit: 10,
    });

    if (Array.isArray(result)) throw new Error();

    expect(result.data.map((u) => u.updatedAt)).toEqual([200, 300]);
  });

  it('throws when old password is wrong', async () => {
    vi.mocked(repository.getOne).mockResolvedValue(
      createUser({
        id: 'user-1',
        login: 'alice',
        password: 'stored-password',
      }),
    );
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      service.updatePassword('user-1', {
        oldPassword: 'wrong-password',
        newPassword: 'next-password',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('returns user when exists', async () => {
    const user = createUser({
      id: '1',
      login: 'alice',
      password: 'x',
    });

    vi.mocked(repository.getOne).mockResolvedValue(user);

    const result = await service.getOne('1');

    expect(result.login).toBe('alice');
    expect(result).toHaveProperty('password');
  });

  it('throws when user is missing on getOne', async () => {
    vi.mocked(repository.getOne).mockResolvedValue(null);

    await expect(service.getOne('missing')).rejects.toThrow(NotFoundError);
  });

  it('updates password successfully', async () => {
    vi.mocked(repository.getOne).mockResolvedValue(
      createUser({
        id: 'user-1',
        login: 'alice',
        password: 'old-hash',
      }),
    );

    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

    vi.mocked(repository.update).mockImplementation(async (user) => user);

    const result = await service.updatePassword('user-1', {
      oldPassword: 'old',
      newPassword: 'new',
    });

    expect(result.login).toBe('alice');
  });

  it('throws NotFoundError when user is missing on updatePassword', async () => {
    vi.mocked(repository.getOne).mockResolvedValue(null);

    await expect(
      service.updatePassword('missing', {
        oldPassword: 'x',
        newPassword: 'y',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('deletes user when exists', async () => {
    vi.mocked(repository.getOne).mockResolvedValue(
      createUser({
        id: 'user-1',
        login: 'alice',
        password: 'x',
      }),
    );

    await service.delete('user-1');

    expect(repository.delete).toHaveBeenCalledWith('user-1');
  });

  it('throws NotFoundError when deleting missing user', async () => {
    vi.mocked(repository.getOne).mockResolvedValue(null);

    await expect(service.delete('id')).rejects.toThrow(NotFoundError);
  });

  it('returns user by login', async () => {
    const user = createUser({
      id: '1',
      login: 'alice',
      password: 'x',
    });

    vi.mocked(repository.getByLogin).mockResolvedValue(user);

    const result = await service.getByLogin('alice');

    expect(result?.login).toBe('alice');
  });

  it('throws when login already exists', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

    vi.mocked(repository.create).mockRejectedValue(
      new Error('Duplicate login'),
    );

    await expect(
      service.create({
        login: 'alice',
        password: 'password',
      }),
    ).rejects.toThrow('Duplicate login');
  });

  it('forces default role even if role is provided', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue('hash' as never);

    vi.mocked(repository.create).mockImplementation(async (user) =>
      createUser({
        id: '1',
        login: user.login,
        password: user.password,
        role: user.role,
      }),
    );

    await service.create({
      login: 'user',
      password: 'pass',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: UserRole.viewer,
      }),
    );
  });
});
