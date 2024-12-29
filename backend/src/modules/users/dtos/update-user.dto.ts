import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IUserDto } from '../interfaces/IUser.dto';
import { TUpdateUser } from '../interfaces/update-user.interfaces';

export class UpdateUserReqDto extends BaseReqDto {
  public readonly userId: number;
  public readonly userData: TUpdateUser;

  public constructor(userId: number, userData: TUpdateUser, currentUserId: number | undefined) {
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
