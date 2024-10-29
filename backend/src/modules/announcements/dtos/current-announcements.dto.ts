import { events } from '@events';
import { IResponse } from '@interfaces';

export interface ICurrentAnnouncementsDto {
  id: string;
  title?: string;
  validFromDate?: Date;
  updatedAt: Date;
  createdBy: string;
  publishedAt?: Date;
  publishedBy?: string;
}

export class GetCurrentAnnouncementsResponseDto implements IResponse<ICurrentAnnouncementsDto | null> {
  public readonly data: ICurrentAnnouncementsDto | null;
  public readonly message: string;

  public constructor(data: ICurrentAnnouncementsDto | null) {
    this.data = data;
    this.message = events.announcements.announcementsRetrieved;
  }
}
