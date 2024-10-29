import { IRequestWithIdentity } from '@interfaces';

export abstract class BaseController {
  protected getCurrentUserId(req: IRequestWithIdentity): number | undefined {
    return req?.identity?.userId;
  }

  protected getCurrentUserUuid(req: IRequestWithIdentity): string | undefined {
    return req?.identity?.userUuid;
  }
}
