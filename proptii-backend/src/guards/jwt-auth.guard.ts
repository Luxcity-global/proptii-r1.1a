import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates Bearer JWT tokens against Azure AD B2C.
 * Apply to controllers or individual routes with @UseGuards(JwtAuthGuard).
 *
 * If MSAL_AUTHORITY or MSAL_CLIENT_ID is not configured the guard will still
 * reject unauthenticated requests, but will log a warning to aid debugging.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Missing or invalid Bearer token');
    }
    return user;
  }
}
