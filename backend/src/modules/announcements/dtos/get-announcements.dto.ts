import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export interface IAnnouncementItemDto {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface IAnnouncementsDto {
  id: string;
  title?: string;
  state: number;
  validFromDate: Date | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  publishedAt?: Date;
  publishedBy?: string;
  items: IAnnouncementItemDto[];
}

export class GetAnnouncementsReqDto extends BaseReqDto {
  public readonly idGuid: string | undefined;

  public constructor(idGuid: string | undefined, currentUserId: number) {
    super(currentUserId);
    this.idGuid = idGuid;
  }
}

export class GetAnnouncementsResponseDto implements IResponse<IAnnouncementsDto> {
  public readonly data: IAnnouncementsDto;
  public readonly message: string;

  public constructor(data: IAnnouncementsDto) {
    this.data = data;
    this.message = events.announcements.announcementsRetrieved;
  }
}
