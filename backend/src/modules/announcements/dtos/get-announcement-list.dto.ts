import { IAnnouncementGridItemDto } from '@core';
import { events } from '@events';
import { IGridPageResponseDto, IPageData, IResponse, ISortData } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export type AnnouncementsGridPageDto = IGridPageResponseDto<IAnnouncementGridItemDto>;

export class GetAnnouncementListReqDto extends BaseReqDto {
  public readonly page: IPageData;
  public readonly sort: ISortData;

  constructor(page: IPageData, sort: ISortData, currentUserId: number | undefined) {
    super(currentUserId);
    this.page = page;
    this.sort = sort;
  }
}

export class GetAnnouncementListResponseDto implements IResponse<AnnouncementsGridPageDto> {
  public readonly data: AnnouncementsGridPageDto;
  public readonly message: string;

  constructor(data: AnnouncementsGridPageDto) {
    this.data = data;
    this.message = events.announcements.announcementsListRetrieved;
  }
}
