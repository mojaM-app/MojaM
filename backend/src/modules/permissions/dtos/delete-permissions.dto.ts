import { BaseReqDto, IResponse, events } from '@core';

export class DeletePermissionsReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;
  public readonly permissionId?: number | undefined;

  constructor(userGuid: string | undefined, permissionId: number | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
    this.permissionId = permissionId;
  }
}

export class DeletePermissionsResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message: string;

  constructor(data: boolean) {
    this.data = data;
    this.message = events.permissions.permissionDeleted;
  }
}
