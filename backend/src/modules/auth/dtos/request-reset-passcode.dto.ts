import { type IResponse } from '@core';

export class RequestResetPasscodeResponseDto implements IResponse<boolean> {
  public readonly data: boolean;

  constructor(result: boolean) {
    this.data = result;
  }
}
