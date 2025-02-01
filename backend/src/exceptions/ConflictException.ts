import StatusCode from 'status-code-enum';
import { TranslatableHttpException } from './TranslatableHttpException';

export class ConflictException extends TranslatableHttpException {
  constructor(translationKey: string, args?: Record<string, unknown>) {
    super(StatusCode.ClientErrorConflict, translationKey, args);
  }
}
