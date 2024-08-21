import { IResponse } from '@interfaces';
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

export class DeletePermissionsResponseDto implements IResponse<boolean> {
  data: boolean;
  message?: string | undefined;

  constructor(data: boolean, message?: string) {
    this.data = data;
    this.message = message;
  }
}
