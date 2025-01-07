import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IHasDefaultValues, IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { isNullOrUndefined, VALIDATOR_SETTINGS } from '@utils';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class UpdateAnnouncementItemDto implements IHasDefaultValues {
  public id?: string;

  @IsNotEmpty({ message: errorKeys.announcements.Item_Content_Is_Required })
  @IsString({ message: errorKeys.announcements.Item_Content_Is_Required })
  @MaxLength(VALIDATOR_SETTINGS.ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH, { message: errorKeys.announcements.Item_Content_Too_Long })
  public content: string;

  public setDefaultValues(): void {
    if (isNullOrUndefined(this.content)) {
      this.content = '';
    }
  }
}

export class UpdateAnnouncementsDto implements IHasDefaultValues {
  @IsOptional()
  @MaxLength(VALIDATOR_SETTINGS.ANNOUNCEMENTS_TITLE_MAX_LENGTH, { message: errorKeys.announcements.Title_Too_Long })
  public title?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public validFromDate?: Date | null;

  @IsOptional()
  @IsArray()
  @Type(() => UpdateAnnouncementItemDto)
  @ValidateNested({ each: true })
  public items?: UpdateAnnouncementItemDto[];

  public setDefaultValues(): void {
    if ((this.items?.length ?? 0) > 0) {
      this.items!.forEach((item: UpdateAnnouncementItemDto) => {
        item.setDefaultValues();
      });
    }
  }
}

export class UpdateAnnouncementsReqDto extends BaseReqDto {
  public readonly announcementsId: string | undefined;
  public readonly announcements: UpdateAnnouncementsDto;

  public constructor(announcementsId: string | undefined, announcements: UpdateAnnouncementsDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.announcementsId = announcementsId;
    this.announcements = announcements;
  }
}

export class UpdateAnnouncementsResponseDto implements IResponse<string> {
  public readonly data: string;
  public readonly message: string;

  public constructor(data: string) {
    this.data = data;
    this.message = events.announcements.announcementsUpdated;
  }
}
