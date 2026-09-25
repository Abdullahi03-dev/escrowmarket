import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SESSION_COOKIE } from './auth.utils';
import type { User } from '../entities/user.entity';

export interface AuthedRequest extends Request {
  user?: User;
  sessionToken?: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const raw =
      req.cookies?.[SESSION_COOKIE] ??
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);
    const user = await this.auth.validateSession(raw);
    if (!user) throw new UnauthorizedException('Not authenticated.');
    req.user = user;
    req.sessionToken = raw;
    return true;
  }
}
