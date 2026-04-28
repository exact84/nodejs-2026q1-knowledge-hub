import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokensService } from './tokens/tokens.service';
import { UnauthorizedError } from '../common/errors/unauthorized.error';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflectorMock: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let tokensServiceMock: { verifyAccessToken: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    reflectorMock = {
      getAllAndOverride: vi.fn(),
    };

    tokensServiceMock = {
      verifyAccessToken: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: reflectorMock,
        },
        {
          provide: TokensService,
          useValue: tokensServiceMock,
        },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
  });

  function createContext(request: {
    headers?: { authorization?: string };
    user?: unknown;
  }): ExecutionContextHost {
    const context = new ExecutionContextHost([request, null, null]);
    context.setType('http');
    return context;
  }

  it('allows public route', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);

    const result = await guard.canActivate(createContext({}));

    expect(result).toBe(true);
    expect(tokensServiceMock.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('throws when authorization header is missing', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws when authorization scheme is invalid', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Basic token' } }),
      ),
    ).rejects.toThrow('Authorization header must use Bearer scheme');
  });

  it('throws when bearer token is missing', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Bearer' } }),
      ),
    ).rejects.toThrow('Authorization header must use Bearer scheme');
  });

  it('verifies token and stores payload in request user', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(false);
    const request = {
      headers: { authorization: 'Bearer valid-token' },
      user: undefined,
    };
    const payload = {
      userId: 'u1',
      login: 'alice',
      role: 'viewer',
    };
    tokensServiceMock.verifyAccessToken.mockResolvedValue(payload);

    const result = await guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(tokensServiceMock.verifyAccessToken).toHaveBeenCalledWith(
      'valid-token',
    );
    expect(request.user).toEqual(payload);
  });
});
