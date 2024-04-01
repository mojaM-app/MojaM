import { BaseReqDto } from '@modules/common';

export class DeletePermissionsReqDto extends BaseReqDto {
  userGuid: string | undefined;
  permissionId?: number | undefined;

  constructor(userGuid: string | undefined, permissionId: number | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
    this.permissionId = permissionId;
  }
}

export class PermissionDeletedEventDto {
  public readonly currentUserId: number | undefined;
  userGuid: string | undefined;
  permissionId: number | undefined;

  public constructor(userGuid: string | undefined, permissionId: number | undefined, currentUserId: number | undefined) {
    this.userGuid = userGuid;
    this.permissionId = permissionId;
    this.currentUserId = currentUserId;
  }
}
