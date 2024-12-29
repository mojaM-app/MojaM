import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IGetUserDto } from '../interfaces/get-user.interfaces';

export class GetUserReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export class GetUserResponseDto implements IResponse<IGetUserDto | null> {
  public readonly data: IGetUserDto | null;
  public readonly message?: string | undefined;

  public constructor(data: IGetUserDto | null) {
    this.data = data;
    this.message = events.users.userDetailsRetrieved;
  }
}