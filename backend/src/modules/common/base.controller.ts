import { RequestWithIdentity } from '@interfaces';

export abstract class BaseController {
  protected getCurrentUserId(req: RequestWithIdentity): number | undefined {
    return req?.identity?.userId;
  }

  protected getCurrentUserUuid(req: RequestWithIdentity): string | undefined {
    return req?.identity?.userUuid;
  }
}
