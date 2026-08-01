import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from './jwt.strategy';

/**
 * Users module only (ADR-039). Other domains remain flat equal active users.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const user = request.user;
    if (!user?.isSuperAdmin) {
      throw new ForbiddenException({
        message: 'Super Admin required',
        code: 'SUPERADMIN_REQUIRED',
      });
    }
    return true;
  }
}
