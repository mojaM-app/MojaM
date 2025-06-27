import { StatusCode } from 'status-code-enum';
import { errorKeys } from './error.keys';
import { TranslatableHttpException } from './TranslatableHttpException';

export class UnauthorizedException extends TranslatableHttpException {
  constructor(translationKey: string = errorKeys.login.User_Not_Authenticated) {
    super(StatusCode.ClientErrorUnauthorized, translationKey);
  }
}
