import { HttpException } from '@exceptions/HttpException';
import StatusCode from 'status-code-enum';

export class TranslatableHttpException extends HttpException {
  public args?: Record<string, unknown>;

  constructor(status: StatusCode, translationKey: string, args?: Record<string, unknown>) {
    super(status, translationKey);
    this.args = args;
  }
}
