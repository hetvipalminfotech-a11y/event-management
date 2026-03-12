import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {

  const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
    ROLES_KEY,
    [context.getHandler(), context.getClass()],
  );

  const request = context.switchToHttp().getRequest();
  const user = request.user;

  console.log("USER:", user);
  console.log("USER ROLE:", user?.role);
  console.log("REQUIRED ROLES:", requiredRoles);

  if (!requiredRoles) return true;
  if (!user) {
  throw new ForbiddenException('User not authenticated');
}

  const hasRole = requiredRoles.includes(user.role);

  console.log("HAS ROLE:", hasRole);

  if (!hasRole) {
    throw new ForbiddenException(
      'You do not have permission to access this resource',
    );
  }

  return true;
}
}
