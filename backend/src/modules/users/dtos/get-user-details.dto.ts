import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IUserDetailsDto } from '../interfaces/user-details.interfaces';

export class GetUserDetailsReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;

  constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}

export class GetUserDetailsResponseDto implements IResponse<IUserDetailsDto | null> {
  public readonly data: IUserDetailsDto | null;
  public readonly message: string;

  constructor(data: IUserDetailsDto | null) {
    this.data = data;
    this.message = events.users.userDetailsRetrieved;
  }
}
