import { BaseReqDto, IResponse, events } from '@core';

export class GetUserReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export interface IGetUserDto {
  id: string;
  email: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  joiningDate: Date | null;
}

export class GetUserResponseDto implements IResponse<IGetUserDto | null> {
  public readonly data: IGetUserDto | null;
  public readonly message: string;

  constructor(data: IGetUserDto | null) {
    this.data = data;
    this.message = events.users.userRetrieved;
  }
}
