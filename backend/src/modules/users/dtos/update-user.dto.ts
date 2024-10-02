import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IUserDto } from './get-user-profile.dto';

export class UpdateUserDto {
  public isActive?: boolean;
  public failedLoginAttempts?: number;
  public isLockedOut?: boolean;
  public lastLoginAt?: Date;
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

export class UpdateUserResponseDto implements IResponse<IUserDto> {
  public readonly data: IUserDto;
  public readonly message?: string | undefined;

  public constructor(data: IUserDto) {
    this.data = data;
    this.message = events.users.userUpdated;
  }
}
