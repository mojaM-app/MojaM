import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class UnlockAccountReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined) {
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

  public constructor(data: IUnlockAccountResultDto) {
    this.data = data;
    this.message = events.users.userUnlocked;
  }
}
