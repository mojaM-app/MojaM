import StatusCode from 'status-code-enum';
import { TranslatableHttpException } from './TranslatableHttpException';
import { error_keys } from './error.keys';

export class UnauthorizedException extends TranslatableHttpException {
  constructor(translationKey: string = error_keys.users.login.User_Not_Authenticated) {
    super(StatusCode.ClientErrorUnauthorized, translationKey);
  }
}
