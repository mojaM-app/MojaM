import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class CreateAnnouncementsDto {
  id: string;
  title?: string;
  validFromDate?: Date;
  publishedAt?: Date;
}

export class CreateAnnouncementsReqDto extends BaseReqDto {
  public readonly announcements: CreateAnnouncementsDto;

  public constructor(announcements: CreateAnnouncementsDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.announcements = announcements;
  }
}

export class CreateAnnouncementsResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message?: string | undefined;

  public constructor(data: boolean) {
    this.data = data;
    this.message = events.announcements.retrieved;
  }
}
