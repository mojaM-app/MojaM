import { BaseReqDto, events, IResponse } from '@core';

export class UnlockAccountReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  constructor(userGuid: string | undefined) {
    super(undefined);
    this.userGuid = userGuid;
  }
}

export interface IUnlockAccountResultDto {
  success: boolean;
}

export class UnlockAccountResponseDto implements IResponse<IUnlockAccountResultDto> {
  public readonly data: IUnlockAccountResultDto;
  public readonly message: string;

  constructor(data: IUnlockAccountResultDto) {
    this.data = data;
    this.message = events.users.userUnlocked;
  }
}
