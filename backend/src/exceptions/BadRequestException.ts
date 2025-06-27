import { StatusCode } from 'status-code-enum';
import { TranslatableHttpException } from './TranslatableHttpException';

export class BadRequestException extends TranslatableHttpException {
  constructor(translationKey: string, args?: Record<string, unknown>) {
    super(StatusCode.ClientErrorBadRequest, translationKey, args);
  }
}
