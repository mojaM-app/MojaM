import { BaseReqDto, events, IResponse } from '@core';
import { IsArray, IsOptional } from 'class-validator';
import { IAnnouncementItemDto } from './get-announcements.dto';

export class GetTopAnnouncementItemsDto {
  @IsOptional()
  @IsArray()
  public excludeItems?: IAnnouncementItemDto[] | undefined;
}

export class GetTopAnnouncementItemsReqDto extends BaseReqDto {
  public readonly numberOfItems: number;
  public readonly excludeItems?: IAnnouncementItemDto[] | undefined;

  constructor(numberOfItems: number, request?: GetTopAnnouncementItemsDto, currentUserId?: number) {
    super(currentUserId);
    this.excludeItems = request?.excludeItems;
    this.numberOfItems = numberOfItems;
  }
}

export interface TopAnnouncementItemDto extends Partial<IAnnouncementItemDto> {
  count: number;
}

export class GetTopAnnouncementItemsResponseDto implements IResponse<TopAnnouncementItemDto[]> {
  public readonly data: TopAnnouncementItemDto[];
  public readonly message: string;

  constructor(data: TopAnnouncementItemDto[]) {
    this.data = data;
    this.message = events.announcements.announcementsItemsRetrieved;
  }
}
