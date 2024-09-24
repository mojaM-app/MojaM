import { IResponse } from '@interfaces';

export class RequestResetPasswordResponseDto implements IResponse<boolean> {
  public readonly data: boolean;

  public constructor(result: boolean) {
    this.data = result;
  }
}
