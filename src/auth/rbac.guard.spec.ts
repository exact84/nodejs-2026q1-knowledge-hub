import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { UserRole } from '@prisma/client';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { RbacGuard } from './rbac.guard';
import { ArticlesService } from '../articles/articles.service';
import { CommentsService } from '../comments/comments.service';
import { ForbiddenError } from '../common/errors/forbidden.error';

type AuthUser = {
  userId: string;
  login: string;
  role: UserRole | 'ghost';
};

type GuardRequest = {
  path: string;
  method: string;
  params: { id: string };
  body: { authorId?: string };
  user?: AuthUser;
};

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflectorMock: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let articlesServiceMock: { findOneOrNull: ReturnType<typeof vi.fn> };
  let commentsServiceMock: { findOneOrNull: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    reflectorMock = {
      getAllAndOverride: vi.fn(),
    };
    articlesServiceMock = {
      findOneOrNull: vi.fn(),
    };
    commentsServiceMock = {
      findOneOrNull: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacGuard,
        { provide: Reflector, useValue: reflectorMock },
        { provide: ArticlesService, useValue: articlesServiceMock },
        { provide: CommentsService, useValue: commentsServiceMock },
      ],
    }).compile();

    guard = module.get(RbacGuard);
  });

  function createRequest(overrides: Partial<GuardRequest> = {}): GuardRequest {
    return {
      path: '/article',
      method: 'POST',
      params: { id: 'id-1' },
      body: {},
      ...overrides,
    };
  }

  function createContext(request: GuardRequest): ExecutionContextHost {
    const context = new ExecutionContextHost([request, null, null]);
    context.setType('http');
    return context;
  }

  it('allows public route', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);

    const result = await guard.canActivate(createContext(createRequest()));

    expect(result).toBe(true);
  });

  it('returns false when user is missing', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    const result = await guard.canActivate(createContext(createRequest()));

    expect(result).toBe(false);
  });

  it('allows admin user', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    const result = await guard.canActivate(
      createContext(
        createRequest({
          user: { userId: 'a1', login: 'admin', role: UserRole.admin },
        }),
      ),
    );

    expect(result).toBe(true);
  });

  it('allows logout route for authenticated user', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    const result = await guard.canActivate(
      createContext(
        createRequest({
          path: '/auth/logout',
          method: 'POST',
          user: { userId: 'u1', login: 'editor', role: UserRole.editor },
        }),
      ),
    );

    expect(result).toBe(true);
  });

  it('allows GET for non-admin authenticated user', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    const result = await guard.canActivate(
      createContext(
        createRequest({
          method: 'GET',
          user: { userId: 'u1', login: 'viewer', role: UserRole.viewer },
        }),
      ),
    );

    expect(result).toBe(true);
  });

  it('throws for viewer on write request', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(
        createContext(
          createRequest({
            method: 'POST',
            user: { userId: 'u1', login: 'viewer', role: UserRole.viewer },
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('allows editor to create article and injects authorId', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const request = createRequest({
      path: '/article',
      method: 'POST',
      body: {},
      user: { userId: 'e1', login: 'editor', role: UserRole.editor },
    });

    const result = await guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(request.body.authorId).toBe('e1');
  });

  it('allows editor to update own article', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    articlesServiceMock.findOneOrNull.mockResolvedValue({ authorId: 'e1' });
    const request = createRequest({
      path: '/article/42',
      method: 'PUT',
      params: { id: '42' },
      body: {},
      user: { userId: 'e1', login: 'editor', role: UserRole.editor },
    });

    const result = await guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(articlesServiceMock.findOneOrNull).toHaveBeenCalledWith('42');
    expect(request.body.authorId).toBe('e1');
  });

  it('denies editor when updating foreign article', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    articlesServiceMock.findOneOrNull.mockResolvedValue({ authorId: 'other' });

    await expect(
      guard.canActivate(
        createContext(
          createRequest({
            path: '/article/42',
            method: 'PUT',
            params: { id: '42' },
            user: { userId: 'e1', login: 'editor', role: UserRole.editor },
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('denies editor for unsupported article method', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(
        createContext(
          createRequest({
            path: '/article/42',
            method: 'DELETE',
            params: { id: '42' },
            user: { userId: 'e1', login: 'editor', role: UserRole.editor },
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('allows editor to create comment and injects authorId', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const request = createRequest({
      path: '/comment',
      method: 'POST',
      body: {},
      user: { userId: 'e1', login: 'editor', role: UserRole.editor },
    });

    const result = await guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(request.body.authorId).toBe('e1');
  });

  it('allows editor to update own comment', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    commentsServiceMock.findOneOrNull.mockResolvedValue({ authorId: 'e1' });
    const request = createRequest({
      path: '/comment/11',
      method: 'PUT',
      params: { id: '11' },
      body: {},
      user: { userId: 'e1', login: 'editor', role: UserRole.editor },
    });

    const result = await guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(commentsServiceMock.findOneOrNull).toHaveBeenCalledWith('11');
    expect(request.body.authorId).toBe('e1');
  });

  it('denies editor when updating foreign comment', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    commentsServiceMock.findOneOrNull.mockResolvedValue({ authorId: 'other' });

    await expect(
      guard.canActivate(
        createContext(
          createRequest({
            path: '/comment/11',
            method: 'PUT',
            params: { id: '11' },
            user: { userId: 'e1', login: 'editor', role: UserRole.editor },
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('denies editor for unsupported comment method', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(
        createContext(
          createRequest({
            path: '/comment/11',
            method: 'DELETE',
            params: { id: '11' },
            user: { userId: 'e1', login: 'editor', role: UserRole.editor },
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws for editor on unsupported route', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(
        createContext(
          createRequest({
            path: '/category',
            method: 'POST',
            user: { userId: 'e1', login: 'editor', role: UserRole.editor },
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws for unsupported role', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(
        createContext(
          createRequest({
            method: 'POST',
            user: { userId: 'x1', login: 'ghost', role: 'ghost' },
          }),
        ),
      ),
    ).rejects.toThrow(ForbiddenError);
  });
});
