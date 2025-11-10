import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { REQUIRED_ADMIN_PERMISSIONS_KEY } from './permissions.decorator.js';
import { isReadonlyAdminPermissionSet, normalizeAdminPermissions } from './admin-permission-set.js';

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_ADMIN_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const permissions = request.adminPermissions;

    if (!permissions) {
      throw new ForbiddenException('Missing admin permission context');
    }

    let permissionSet;
    try {
      permissionSet = isReadonlyAdminPermissionSet(permissions)
        ? permissions
        : normalizeAdminPermissions(permissions as unknown as Iterable<unknown>);
    } catch (error) {
      throw new ForbiddenException('Invalid admin permission context');
    }

    Object.defineProperty(request, 'adminPermissions', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: permissionSet,
    });

    const missing = required.filter((perm) => !permissionSet.has(perm));
    if (missing.length) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    return true;
  }
}
