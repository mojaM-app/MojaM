import { HttpException } from './HttpException';

export class TranslatableHttpException extends HttpException {
  public args: (string | number)[];

  constructor(status: number, message: string, args?: (string | number)[]) {
    super(status, message);
    this.args = args;
  }
}
