import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IHasDefaultValues, IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { isNullOrUndefined } from '@utils';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class CreateAnnouncementItemDto implements IHasDefaultValues {
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

export class CreateAnnouncementsDto implements IHasDefaultValues {
  @IsOptional()
  @MaxLength(VALIDATOR_SETTINGS.ANNOUNCEMENTS_TITLE_MAX_LENGTH, { message: errorKeys.announcements.Title_Too_Long })
  public title?: string | undefined;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public validFromDate?: Date | null;

  @IsOptional()
  @IsArray()
  @Type(() => CreateAnnouncementItemDto)
  @ValidateNested({ each: true })
  public items?: CreateAnnouncementItemDto[];

  public setDefaultValues(): void {
    if ((this.items?.length ?? 0) > 0) {
      this.items!.forEach((item: CreateAnnouncementItemDto) => {
        item.setDefaultValues();
      });
    }
  }
}

export class CreateAnnouncementsReqDto extends BaseReqDto {
  public readonly announcements: CreateAnnouncementsDto;

  public constructor(announcements: CreateAnnouncementsDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.announcements = announcements;
  }
}

export class CreateAnnouncementsResponseDto implements IResponse<string> {
  public readonly data: string;
  public readonly message: string;

  public constructor(data: string) {
    this.data = data;
    this.message = events.announcements.announcementsCreated;
  }
}
