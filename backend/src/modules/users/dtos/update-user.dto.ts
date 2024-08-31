import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IUser } from '../interfaces/IUser';

export class UpdateUserDto {
  public isActive?: boolean;
  public failedLoginAttempts?: number;
  public isLockedOut?: boolean;
}

export class UpdateUserReqDto extends BaseReqDto {
  public readonly userId: number;
  public readonly userData: UpdateUserDto;

  public constructor(userId: number, userData: UpdateUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.userId = userId;
    this.userData = userData;
  }
}

export class UpdateUserResponseDto implements IResponse<IUser> {
  public readonly data: IUser;
  public readonly message?: string | undefined;

  public constructor(data: IUser) {
    this.data = data;
    this.message = events.users.userUpdated;
  }
}
