import {
  BaseReqDto,
  events,
  type IGridPageResponseDto,
  type IPageData,
  type IResponse,
  type ISortData,
  type IUserGridItemDto,
} from '@core';

export type TUsersGridPageDto = IGridPageResponseDto<IUserGridItemDto>;

export class GetUserListReqDto extends BaseReqDto {
  public readonly page: IPageData;
  public readonly sort: ISortData;

  constructor(page: IPageData, sort: ISortData, currentUserId: number | undefined) {
    super(currentUserId);
    this.page = page;
    this.sort = sort;
  }
}

export class GetUserListResponseDto implements IResponse<TUsersGridPageDto> {
  public readonly data: TUsersGridPageDto;
  public readonly message: string;

  constructor(data: TUsersGridPageDto) {
    this.data = data;
    this.message = events.users.userListRetrieved;
  }
}
