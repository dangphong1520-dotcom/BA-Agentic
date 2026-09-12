import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { entityIdSchema } from '@ba/contracts';

@Injectable()
export class DevelopmentAuthGuard implements CanActivate {
  private readonly token = process.env.DEV_AUTH_TOKEN;
  private readonly userId = process.env.DEV_USER_ID;
  private readonly enabled =
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_AUTH_ENABLED === 'true';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (
      !this.enabled ||
      !this.token ||
      this.token.length < 32 ||
      !entityIdSchema.safeParse(this.userId).success ||
      !header?.startsWith('Bearer ')
    )
      throw new UnauthorizedException();
    const supplied = Buffer.from(header.slice(7));
    const expected = Buffer.from(this.token);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    )
      throw new UnauthorizedException();
    context
      .switchToHttp()
      .getResponse<Response<unknown, { userId: string }>>().locals.userId =
      entityIdSchema.parse(this.userId);
    return true;
  }
}
