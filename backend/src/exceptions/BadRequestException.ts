import StatusCode from 'status-code-enum';
import { TranslatableHttpException } from './TranslatableHttpException';

export class BadRequestException extends TranslatableHttpException {
  constructor(translationKey: string, args?: Record<string, string | number | Date>) {
    super(StatusCode.ClientErrorBadRequest, translationKey, args);
  }
}
