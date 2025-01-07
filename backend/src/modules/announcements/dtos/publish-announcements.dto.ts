import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class PublishAnnouncementsReqDto extends BaseReqDto {
  public readonly announcementsId: string | undefined;

  public constructor(announcementsId: string | undefined, currentUserId: number) {
    super(currentUserId);
    this.announcementsId = announcementsId;
  }
}

export class PublishAnnouncementsResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message: string;

  public constructor(data: boolean) {
    this.data = data;
    this.message = events.announcements.announcementsPublished;
  }
}
