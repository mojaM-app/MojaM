import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export interface IUserPermissionsDto {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone: string;
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
