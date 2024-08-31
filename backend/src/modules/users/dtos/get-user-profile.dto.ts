import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IUserProfile } from '../interfaces/IUserProfile';

export class GetUserProfileReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export class GetUserProfileResponseDto implements IResponse<IUserProfile | null> {
  public readonly data: IUserProfile | null;
  public readonly message?: string | undefined;

  public constructor(data: IUserProfile | null) {
    this.data = data;
    this.message = events.users.userRetrieved;
  }
}
