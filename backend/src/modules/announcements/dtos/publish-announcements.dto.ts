import { BaseReqDto, events, type IResponse } from '@core';

export class PublishAnnouncementsReqDto extends BaseReqDto {
  public readonly announcementsId: string | undefined;

  constructor(announcementsId: string | undefined, currentUserId: number) {
    super(currentUserId);
    this.announcementsId = announcementsId;
  }
}

export class PublishAnnouncementsResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message: string;

  constructor(data: boolean) {
    this.data = data;
    this.message = events.announcements.announcementsPublished;
  }
}
