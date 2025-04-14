import StatusCode from 'status-code-enum';
import { errorKeys } from './error.keys';
import { TranslatableHttpException } from './TranslatableHttpException';

export class ForbiddenException extends TranslatableHttpException {
  constructor(translationKey: string = errorKeys.login.User_Not_Authorized) {
    super(StatusCode.ClientErrorForbidden, translationKey);
  }
}
