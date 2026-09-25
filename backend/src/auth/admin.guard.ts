import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SessionGuard, type AuthedRequest } from './session.guard';

/** Session + ADMIN role. Promote via SQL:
 *  UPDATE users SET role='ADMIN' WHERE email='you@example.com'; */
@Injectable()
export class AdminGuard extends SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required.');
    }
    return true;
  }
}
