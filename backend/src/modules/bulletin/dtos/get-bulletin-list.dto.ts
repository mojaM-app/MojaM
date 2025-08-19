import {
  BaseReqDto,
  events,
  type IBulletinGridItemDto,
  type IGridPageResponseDto,
  type IPageData,
  type IResponse,
  type ISortData,
} from '@core';

export type BulletinsGridPageDto = IGridPageResponseDto<IBulletinGridItemDto>;

export class GetBulletinListReqDto extends BaseReqDto {
  public readonly page: IPageData;
  public readonly sort: ISortData;

  constructor(page: IPageData, sort: ISortData, currentUserId: number | undefined) {
    super(currentUserId);
    this.page = page;
    this.sort = sort;
  }
}

export class GetBulletinListResponseDto implements IResponse<BulletinsGridPageDto> {
  public readonly data: BulletinsGridPageDto;
  public readonly message: string;

  constructor(data: BulletinsGridPageDto) {
    this.data = data;
    this.message = events.bulletin.bulletinListRetrieved;
  }
}
