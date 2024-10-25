import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IUserProfileDto } from '../interfaces/get-user-profile.interfaces';

export class GetUserProfileReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export class GetUserProfileResponseDto implements IResponse<IUserProfileDto | null> {
  public readonly data: IUserProfileDto | null;
  public readonly message?: string | undefined;

  public constructor(data: IUserProfileDto | null) {
    this.data = data;
    this.message = events.users.userProfileRetrieved;
  }
}
