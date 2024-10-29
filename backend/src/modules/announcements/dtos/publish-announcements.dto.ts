import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class PublishAnnouncementsReqDto extends BaseReqDto {
  public readonly idGuid: string | undefined;

  public constructor(idGuid: string | undefined, currentUserId: number) {
    super(currentUserId);
    this.idGuid = idGuid;
  }
}

export class PublishAnnouncementsResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message?: string | undefined;

  public constructor(data: boolean) {
    this.data = data;
    this.message = events.announcements.announcementsDeleted;
  }
}
