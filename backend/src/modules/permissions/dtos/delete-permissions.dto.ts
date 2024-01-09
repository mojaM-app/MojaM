import { BasePayload, BaseReqDto } from '@modules/common';
import { Guid } from 'guid-typescript';

export class DeletePermissionsReqDto extends BaseReqDto {
  userGuid: Guid;
  permissionId?: number | undefined;

  constructor(userGuid: Guid, permissionId: number | undefined, currentUserId: number | undefined) {
    super();
    this.userGuid = userGuid;
    this.permissionId = permissionId;
    this.currentUserId = currentUserId;
  }
}

export class DeletePermissionsPayload extends BasePayload {
  userId: number;
  permissionId?: number | undefined;

  constructor(userId: number, req: DeletePermissionsReqDto) {
    super();
    this.userId = userId;
    this.permissionId = req.permissionId;
    this.currentUserId = req.currentUserId;
  }
}
