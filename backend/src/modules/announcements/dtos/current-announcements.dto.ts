import { events } from '@events';
import { IResponse } from '@interfaces';
import { IAnnouncementsDto } from '@modules/announcements';

export interface ICurrentAnnouncementsDto extends IAnnouncementsDto {
}

export class GetCurrentAnnouncementsResponseDto implements IResponse<ICurrentAnnouncementsDto | null> {
  public readonly data: ICurrentAnnouncementsDto | null;
  public readonly message: string;

  public constructor(data: ICurrentAnnouncementsDto | null) {
    this.data = data;
    this.message = events.announcements.announcementsRetrieved;
  }
}
