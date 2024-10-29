import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class DeleteAnnouncementsReqDto extends BaseReqDto {
  public readonly idGuid: string | undefined;

  public constructor(idGuid: string | undefined, currentUserId: number) {
    super(currentUserId);
    this.idGuid = idGuid;
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
