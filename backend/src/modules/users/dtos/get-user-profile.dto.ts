import { BaseReqDto } from '@modules/common';
import { IUserProfile } from '../interfaces/IUserProfile';

export class GetUserProfileReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export class UserRetrievedEventDto {
  public readonly currentUserId: number | undefined;
  public readonly user: IUserProfile;

  public constructor(user: IUserProfile, currentUserId: number | undefined) {
    this.user = user;
    this.currentUserId = currentUserId;
  }
}
