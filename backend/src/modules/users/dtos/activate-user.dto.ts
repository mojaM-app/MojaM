import { BasePayload, BaseReqDto } from '@modules/common';
import { Guid } from 'guid-typescript';

export class ActivateUserReqDto extends BaseReqDto {
  userGuid: Guid;

  constructor(userGuid: Guid, currentUserId: number | undefined) {
    super();
    this.userGuid = userGuid;
    this.currentUserId = currentUserId;
  }
}

export class ActivateUserPayload extends BasePayload {
  userId: number;

  constructor(userId: number, req: ActivateUserReqDto) {
    super();
    this.userId = userId;
    this.currentUserId = req.currentUserId;
  }
}
