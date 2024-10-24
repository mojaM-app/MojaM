import { HttpException } from '@exceptions/HttpException';
import StatusCode from 'status-code-enum';

export class TranslatableHttpException extends HttpException {
  public args?: Array<string | number | Date>;

  constructor(status: StatusCode, translationKey: string, args?: Array<string | number | Date>) {
    super(status, translationKey);
    this.args = args;
  }
}
