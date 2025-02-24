import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class GetUserProfileReqDto extends BaseReqDto {
  public constructor(currentUserId: number | undefined) {
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

  public constructor(data: IGetUserProfileDto | null) {
    this.data = data;
    this.message = events.users.userProfileRetrieved;
  }
}
