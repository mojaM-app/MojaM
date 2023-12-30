import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { error_keys } from '@exceptions/error.keys';
import StatusCode from 'status-code-enum';

export class UnauthorizedException extends TranslatableHttpException {
  constructor(translationKey: string = error_keys.users.login.User_Not_Authenticated) {
    super(StatusCode.ClientErrorUnauthorized, translationKey);
  }
}
