import 'reflect-metadata';

import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { REQUIRED_ADMIN_PERMISSIONS_KEY } from './permissions.decorator.js';
import { AdminPermissionsGuard } from './admin-permissions.guard.js';

const buildContext = (request: Record<string, unknown>, handler: Function) => {
  return {
    getHandler: () => handler,
    getClass: () => class Dummy {},
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;
};

describe('AdminPermissionsGuard', () => {
  const reflector = new Reflector();
  const guard = new AdminPermissionsGuard(reflector);

  it('allows requests when required permissions are present', () => {
    const handler = () => undefined;
    Reflect.defineMetadata(REQUIRED_ADMIN_PERMISSIONS_KEY, ['ticket:order:view'], handler);

    const request: Record<string, unknown> = {
      adminPermissions: new Set(['ticket:order:view']),
    };

    const context = buildContext(request, handler);

    expect(guard.canActivate(context)).toBe(true);
    expect('add' in (request.adminPermissions as object)).toBe(false);
  });

  it('rejects malformed permission payloads', () => {
    const handler = () => undefined;
    Reflect.defineMetadata(REQUIRED_ADMIN_PERMISSIONS_KEY, ['ticket:order:view'], handler);

    const request: Record<string, unknown> = {
      adminPermissions: ['ticket:order:view', ''],
    };

    const context = buildContext(request, handler);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects requests when permission is missing', () => {
    const handler = () => undefined;
    Reflect.defineMetadata(REQUIRED_ADMIN_PERMISSIONS_KEY, ['ticket:order:refund'], handler);

    const request: Record<string, unknown> = {
      adminPermissions: new Set(['ticket:order:view']),
    };

    const context = buildContext(request, handler);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
