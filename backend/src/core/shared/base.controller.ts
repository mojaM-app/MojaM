import { type IRequestWithIdentity } from '../interfaces/request.interfaces';

export abstract class BaseController {
  protected getCurrentUserId(req: IRequestWithIdentity): number | undefined {
    return req.identity?.userId;
  }
}
