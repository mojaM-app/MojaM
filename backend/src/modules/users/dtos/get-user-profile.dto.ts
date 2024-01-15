import { BaseReqDto } from '@modules/common';

export class GetUserProfileReqDto extends BaseReqDto {
  userGuid: string | undefined;

  constructor(userGuid: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
  }
}
