import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export interface IUserPermissionsDto {
  id: string;
  name: string;
  permissions: string;
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
