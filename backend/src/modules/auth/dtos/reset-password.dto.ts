import { IResponse } from '@interfaces';

export class ResetPasswordResponseDto implements IResponse<boolean> {
  public readonly data: boolean;

  public constructor(data: boolean) {
    this.data = data;
  }
}
