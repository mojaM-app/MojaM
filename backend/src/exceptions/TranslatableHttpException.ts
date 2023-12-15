import StatusCode from 'status-code-enum';
import { HttpException } from './HttpException';

export class TranslatableHttpException extends HttpException {
  public args: (string | number)[];

  constructor(status: StatusCode, translationKey: string, args?: (string | number)[]) {
    super(status, translationKey);
    this.args = args;
  }
}
