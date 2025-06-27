import type { StatusCode } from 'status-code-enum';
import { HttpException } from './HttpException';

export class TranslatableHttpException extends HttpException {
  public args?: Record<string, unknown>;

  constructor(status: StatusCode, translationKey: string, args?: Record<string, unknown>) {
    super(status, translationKey);
    this.args = args;
  }
}
