import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates Bearer JWT tokens against Azure AD B2C.
 * Apply to controllers or individual routes with @UseGuards(JwtAuthGuard).
 *
 * Passport's JWT strategy often returns `user: false` and puts the failure on `info`
 * while `err` is null — the parent AuthGuard only checks `err` and `user`, so we
 * must log `info` in development to see "invalid signature", "jwt audience invalid", etc.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (process.env.NODE_ENV !== 'production' && authHeader && authHeader.startsWith('Bearer mock-token-')) {
      const id = authHeader.split('mock-token-')[1];
      let name = 'Test User';
      let email = 'tenant@test.proptii.co';
      let role = 'tenant';
      if (id.startsWith('tenant')) {
        role = 'tenant';
        if (id === 'tenant-test-001') { name = 'Sarah Jones'; email = 'tenant@test.proptii.co'; }
        if (id === 'tenant-test-002') { name = 'Emily Davis'; email = 'tenant-two@test.proptii.co'; }
      } else if (id.startsWith('landlord')) {
        role = 'landlord';
        if (id === 'landlord-test-001') { name = 'John Smith'; email = 'landlord@test.proptii.co'; }
        if (id === 'landlord-test-002') { name = 'Jack Smith'; email = 'landlord-two@test.proptii.co'; }
      }
      request.user = { sub: id, name, email, role };
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    info?: unknown,
    _context?: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      const detail = this.describeJwtFailure(err, info);
      if (detail && process.env.NODE_ENV !== 'production') {
        this.logger.warn(`JWT auth failed: ${detail}`);
      }
      throw new UnauthorizedException(
        detail || 'Missing or invalid Bearer token',
      );
    }
    return user;
  }

  private describeJwtFailure(err: Error | null, info: unknown): string {
    if (err?.message) return err.message;
    if (info == null) return '';
    if (typeof info === 'string') return info;
    if (info instanceof Error) return info.message;
    if (typeof info === 'object' && info !== null && 'message' in info) {
      return String((info as { message: unknown }).message);
    }
    return '';
  }
}
