import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export interface IUserDto {
  id: string;
  email: string;
  phone: string;
}

export interface IUserProfileDto extends IUserDto {
  firstName?: string | null;
  lastName?: string | null;
}

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
    this.message = events.users.userRetrieved;
  }
}
