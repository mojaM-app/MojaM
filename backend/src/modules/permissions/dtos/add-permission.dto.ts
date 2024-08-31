import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class AddPermissionReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;
  public readonly permissionId: number | undefined;

  constructor(userGuid: string | undefined, permissionId: number | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
    this.permissionId = permissionId;
  }
}

export class AddPermissionsResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message?: string | undefined;

  constructor(data: boolean, message?: string) {
    this.data = data;
    this.message = message;
  }
}
