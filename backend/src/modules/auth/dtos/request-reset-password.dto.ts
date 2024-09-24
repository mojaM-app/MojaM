import { IResponse } from '@interfaces';

export class RequestResetPasswordResponseDto implements IResponse<boolean> {
  public readonly data: boolean;

  public constructor(data: boolean) {
    this.data = data;
  }
}
