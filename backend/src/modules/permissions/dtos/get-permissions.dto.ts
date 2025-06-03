import { BaseReqDto } from '@core';
import { IResponse } from '@core';
import { events } from '@events';

export interface IUserPermissionsDto {
  id: string;
  name: string;
  permissions: string;
  readonlyPermissions: string | undefined;
}

export class GetPermissionsReqDto extends BaseReqDto {}

export class GetPermissionsResponseDto implements IResponse<IUserPermissionsDto[]> {
  public readonly data: IUserPermissionsDto[];
  public readonly message: string;

  constructor(data: IUserPermissionsDto[]) {
    this.data = data;
    this.message = events.permissions.permissionsRetrieved;
  }
}
