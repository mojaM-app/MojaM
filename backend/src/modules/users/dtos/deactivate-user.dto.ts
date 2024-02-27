import { BaseReqDto } from '@modules/common';
import { IUser } from '../interfaces/IUser';

export class DeactivateUserReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export class UserDeactivatedEventDto {
  public readonly currentUserId: number | undefined;
  public readonly user: IUser;

  public constructor(user: IUser, currentUserId: number | undefined) {
    this.user = user;
    this.currentUserId = currentUserId;
  }
}
