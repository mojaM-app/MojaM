import { events } from '@events';
import { IResponse } from '@interfaces';

export class GetAnnouncementsDto {
  public date!: Date;
  public announcements!: string[];
}

export class GetAnnouncementsResponseDto implements IResponse<GetAnnouncementsDto> {
  data: GetAnnouncementsDto;
  message?: string | undefined;

  public constructor(data: GetAnnouncementsDto) {
    this.data = data;
    this.message = events.news.announcements.retrieved;
  }
}
