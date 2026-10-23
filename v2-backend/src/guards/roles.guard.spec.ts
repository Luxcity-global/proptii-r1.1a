import { describe, it, expect, beforeEach } from 'vitest';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('RolesGuard Security Enforcement (Phase 1)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any, requiredRoles?: string[]): ExecutionContext {
    reflector.getAllAndOverride = () => requiredRoles;
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access when no roles are required on the route', () => {
    const ctx = createMockContext({ uid: 'user-1' }, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user is unauthenticated (!user)', () => {
    const ctx = createMockContext(null, ['landlord']);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('User is not authenticated');
  });

  it('strictly throws ForbiddenException when user has no assigned role (no landlord fallback)', () => {
    const ctx = createMockContext({ uid: 'user-no-role' }, ['landlord']);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Access denied: User has no assigned role');
  });

  it('strictly throws ForbiddenException when role does not match required roles', () => {
    const ctx = createMockContext({ uid: 'tenant-1', role: 'tenant' }, ['landlord', 'agent']);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('User does not have the required role');
  });

  it('allows access when user role matches one of the required roles', () => {
    const landlordCtx = createMockContext({ uid: 'll-1', role: 'landlord' }, ['landlord', 'agent']);
    expect(guard.canActivate(landlordCtx)).toBe(true);

    const agentCtx = createMockContext({ uid: 'ag-1', role: 'agent' }, ['landlord', 'agent']);
    expect(guard.canActivate(agentCtx)).toBe(true);
  });
});
