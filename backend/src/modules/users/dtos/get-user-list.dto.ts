import { events } from '@events';
import { IGridPageResponseDto, IPageData, IResponse, ISortData } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export interface IUserGridItemDto {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  joiningDate?: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  isLockedOut: boolean;
  permissionCount: number;
}

export type UsersGridPageDto = IGridPageResponseDto<IUserGridItemDto>;

export class GetUserListReqDto extends BaseReqDto {
  public readonly page: IPageData;
  public readonly sort: ISortData;

  public constructor(page: IPageData, sort: ISortData, currentUserId: number | undefined) {
    super(currentUserId);
    this.page = page;
    this.sort = sort;
  }
}

export class GetUserListResponseDto implements IResponse<UsersGridPageDto> {
  public readonly data: UsersGridPageDto;
  public readonly message: string;

  public constructor(data: UsersGridPageDto) {
    this.data = data;
    this.message = events.users.userListRetrieved;
  }
}
