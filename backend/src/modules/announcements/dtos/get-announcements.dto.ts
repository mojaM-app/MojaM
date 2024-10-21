import { events } from '@events';
import { IResponse } from '@interfaces';

export interface IAnnouncementsDto {
  id: string;
  title?: string;
  validFromDate?: Date;
  publishedAt?: Date;
}

export class GetAnnouncementsResponseDto implements IResponse<IAnnouncementsDto> {
  public readonly data: IAnnouncementsDto;
  public readonly message: string;

  public constructor(data: IAnnouncementsDto) {
    this.data = data;
    this.message = events.announcements.retrieved;
  }
}
