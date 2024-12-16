import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class DeleteAnnouncementsReqDto extends BaseReqDto {
  public readonly announcementsId: string | undefined;

  public constructor(announcementsId: string | undefined, currentUserId: number) {
    super(currentUserId);
    this.announcementsId = announcementsId;
  }
}

export class DeleteAnnouncementsResponseDto implements IResponse<string | null> {
  public readonly data: string | null;
  public readonly message?: string | undefined;

  public constructor(data: string | null) {
    this.data = data;
    this.message = events.announcements.announcementsDeleted;
  }
}
