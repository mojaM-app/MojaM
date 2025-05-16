import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { DtoTransformFunctions } from '@helpers';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class CreateAnnouncementItemDto {
  @IsNotEmpty({ message: errorKeys.announcements.Item_Content_Is_Required })
  @IsString({ message: errorKeys.announcements.Item_Content_Is_Required })
  @MaxLength(VALIDATOR_SETTINGS.ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH, { message: errorKeys.announcements.Item_Content_Too_Long })
  @Transform(DtoTransformFunctions.getEmptyStringIfNotSet)
  public content: string;

  constructor() {
    this.content = '';
  }
}

export class CreateAnnouncementsDto {
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
}

export class CreateAnnouncementsReqDto extends BaseReqDto {
  public readonly announcements: CreateAnnouncementsDto;

  constructor(announcements: CreateAnnouncementsDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.announcements = announcements;
  }
}

export class CreateAnnouncementsResponseDto implements IResponse<string> {
  public readonly data: string;
  public readonly message: string;

  constructor(data: string) {
    this.data = data;
    this.message = events.announcements.announcementsCreated;
  }
}
