import { BasePayload, BaseReqDto } from '@modules/common';
import { Guid } from 'guid-typescript';

export class AddPermissionReqDto extends BaseReqDto {
  userGuid: Guid;
  permissionId: number;

  constructor(userGuid: Guid, permissionId: number, currentUserId: number | undefined) {
    super();
    this.userGuid = userGuid;
    this.permissionId = permissionId;
    this.currentUserId = currentUserId;
  }
}

export class AddPermissionPayload extends BasePayload {
  userId: number;
  permissionId: number;

  constructor(userId: number, req: AddPermissionReqDto) {
    super();
    this.userId = userId;
    this.permissionId = req.permissionId;
    this.currentUserId = req.currentUserId;
  }
}
