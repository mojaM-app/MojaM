import { BaseReqDto, events, type IResponse } from '@core';

export class GetUserProfileReqDto extends BaseReqDto {
  constructor(currentUserId: number | undefined) {
    super(currentUserId);
  }
}

export interface IGetUserProfileDto {
  email: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  joiningDate: Date | null;
}

export class GetUserProfileResponseDto implements IResponse<IGetUserProfileDto | null> {
  public readonly data: IGetUserProfileDto | null;
  public readonly message: string;

  constructor(data: IGetUserProfileDto | null) {
    this.data = data;
    this.message = events.users.userProfileRetrieved;
  }
}
