import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestContext } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {

  use(req: any, res: any, next: () => void) {

    if (req.user) {
      RequestContext.setUserId(req.user.id);
    }

    next();
  }

}