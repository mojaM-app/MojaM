import StatusCode from 'status-code-enum';
import { TranslatableHttpException } from './TranslatableHttpException';
import { error_keys } from './error.keys';

export class ForbiddenException extends TranslatableHttpException {
  constructor(translationKey: string = error_keys.login.User_Not_Authenticated) {
    super(StatusCode.ClientErrorForbidden, translationKey);
  }
}
