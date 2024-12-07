import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { AnnouncementItemContentMaxLength, AnnouncementsTitleMaxLength } from './create-announcements.dto';

export class UpdateAnnouncementItemDto {
  @IsNotEmpty({ message: errorKeys.announcements.Item_Content_Is_Required })
  @IsString({ message: errorKeys.announcements.Item_Content_Is_Required })
  @MaxLength(AnnouncementItemContentMaxLength, { message: errorKeys.announcements.Item_Content_Too_Long })
  public content: string;
}

export class UpdateAnnouncementsDto {
  @IsNotEmpty()
  @IsUUID()
  public id: string;

  @IsOptional()
  @MaxLength(AnnouncementsTitleMaxLength, { message: errorKeys.announcements.Title_Too_Long })
  public title?: string | undefined;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public validFromDate?: Date | undefined;

  @IsOptional()
  @IsArray()
  @Type(() => UpdateAnnouncementItemDto)
  @ValidateNested({ each: true })
  public items?: UpdateAnnouncementItemDto[];
}

export class UpdateAnnouncementsReqDto extends BaseReqDto {
  public readonly announcements: UpdateAnnouncementsDto;

  public constructor(announcements: UpdateAnnouncementsDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.announcements = announcements;
  }
}

export class UpdateAnnouncementsResponseDto implements IResponse<string> {
  public readonly data: string;
  public readonly message?: string | undefined;

  public constructor(data: string) {
    this.data = data;
    this.message = events.announcements.announcementsUpdated;
  }
}
