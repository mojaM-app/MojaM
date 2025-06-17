import { IUserDto, events, IResponse, BaseReqDto } from '@core';

export class GetUserDetailsReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export interface IUserDetailsDto extends IUserDto {
  firstName: string | null;
  lastName: string | null;
  joiningDate: Date | null;
  lastLoginAt: Date | null;
  isActive: boolean;
  isLockedOut: boolean;
  permissionCount: number;
}

export class GetUserDetailsResponseDto implements IResponse<IUserDetailsDto | null> {
  public readonly data: IUserDetailsDto | null;
  public readonly message: string;

  constructor(data: IUserDetailsDto | null) {
    this.data = data;
    this.message = events.users.userDetailsRetrieved;
  }
}
