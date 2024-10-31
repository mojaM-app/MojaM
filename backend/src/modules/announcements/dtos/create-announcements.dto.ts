import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IHasDefaultValues, IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { isNullOrUndefined } from '@utils';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { IAnnouncementsDto } from './get-announcements.dto';

export class CreateAnnouncementItemDto implements IHasDefaultValues {
  @IsNotEmpty({ message: errorKeys.announcements.Announcements_Item_Content_Is_Required })
  @IsString({ message: errorKeys.announcements.Announcements_Item_Content_Is_Required })
  @MaxLength(8000, { message: errorKeys.announcements.Announcements_Item_Content_Too_Long })
  public content: string;

  public setDefaultValues(): void {
    if (isNullOrUndefined(this.content)) {
      this.content = '';
    }
  }
}

export class CreateAnnouncementsDto implements IHasDefaultValues {
  @IsOptional()
  @MaxLength(255, { message: errorKeys.announcements.Announcements_Title_Too_Long })
  public title?: string | undefined;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public validFromDate?: Date | undefined;

  @IsOptional()
  @IsArray()
  @Type(() => CreateAnnouncementItemDto)
  @ValidateNested({ each: true })
  public items?: CreateAnnouncementItemDto[];

  public setDefaultValues(): void {
    if ((this.items?.length ?? 0) > 0) {
      this.items!.forEach((item: CreateAnnouncementItemDto) => { item.setDefaultValues(); });
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

export class CreateAnnouncementsResponseDto implements IResponse<IAnnouncementsDto | null> {
  public readonly data: IAnnouncementsDto | null;
  public readonly message?: string | undefined;

  public constructor(data: IAnnouncementsDto | null) {
    this.data = data;
    this.message = events.announcements.announcementsCreated;
  }
}
