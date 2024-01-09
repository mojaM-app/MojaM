import { BasePayload, BaseReqDto } from '@modules/common';
import { Guid } from 'guid-typescript';

export class DeactivateUserReqDto extends BaseReqDto {
  userGuid: Guid;

  constructor(userGuid: Guid, currentUserId: number | undefined) {
    super();
    this.userGuid = userGuid;
    this.currentUserId = currentUserId;
  }
}

export class DeactivateUserPayload extends BasePayload {
  userId: number;

  constructor(userId: number, req: DeactivateUserReqDto) {
    super();
    this.userId = userId;
    this.currentUserId = req.currentUserId;
  }
}
