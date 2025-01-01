import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class UnlockUserReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export class UnlockUserResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message?: string | undefined;

  public constructor(data: boolean) {
    this.data = data;
    this.message = events.users.userUnlocked;
  }
}
