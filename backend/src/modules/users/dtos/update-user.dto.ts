import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IUserDto } from '../interfaces/get-user.interfaces';

export class UpdateUserDto {
  public isActive?: boolean;
  public failedLoginAttempts?: number;
  public isLockedOut?: boolean;
  public lastLoginAt?: Date;
}

export class UpdateUserPasswordDto {
  public password: string;
  public salt: string;
  public emailConfirmed: boolean;
  public failedLoginAttempts: number;
}

export class UpdateUserReqDto extends BaseReqDto {
  public readonly userId: number;
  public readonly userData: UpdateUserDto | UpdateUserPasswordDto;

  public constructor(userId: number, userData: UpdateUserDto | UpdateUserPasswordDto, currentUserId: number | undefined) {
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
