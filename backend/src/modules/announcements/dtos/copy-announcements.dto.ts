import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';

export class CopyAnnouncementsReqDto extends BaseReqDto {
  public readonly announcementsId: string | undefined;

  public constructor(announcementsId: string | undefined, currentUserId: number) {
    super(currentUserId);
    this.announcementsId = announcementsId;
  }
}

export class CopyAnnouncementsResultDto {
  public success: boolean;
  public uuid?: string;
}

export class CopyAnnouncementsResponseDto implements IResponse<CopyAnnouncementsResultDto> {
  public readonly data: CopyAnnouncementsResultDto;
  public readonly message?: string | undefined;

  public constructor(data: CopyAnnouncementsResultDto) {
    this.data = data;
    this.message = events.announcements.announcementsCreated;
  }
}
