import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

import { REQUIRED_ADMIN_PERMISSIONS_KEY } from './permissions.decorator.js';

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

    const missing = required.filter((perm) => !permissions.has(perm));
    if (missing.length) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    return true;
  }
}
