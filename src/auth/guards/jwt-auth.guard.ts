import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
    info: Error | null,
    context: ExecutionContext,
  ): TUser {

  //   console.log('ERROR:', err);
  // console.log('USER:', user);
  // console.log('INFO:', info);

    if (err || !user) {
      throw new UnauthorizedException('Invalid or missing access token');
    }

    return user;
  }
}