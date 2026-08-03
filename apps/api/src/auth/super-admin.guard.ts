import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from './jwt.strategy';

/**
 * Narrow administrative boundary: Users plus Cash Account creation/ownership
 * (ADR-039 / ADR-040). Cash transactions remain flat-equal active-user actions.
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
