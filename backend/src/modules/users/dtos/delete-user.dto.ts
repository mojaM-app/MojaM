import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class DeleteUserReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export class DeleteUserResponseDto implements IResponse<string | null> {
  public readonly data: string | null;
  public readonly message?: string | undefined;

  public constructor(data: string | null) {
    this.data = data;
    this.message = events.users.userDeleted;
  }
}
