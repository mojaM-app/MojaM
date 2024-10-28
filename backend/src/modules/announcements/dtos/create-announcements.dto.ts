import { events } from '@events';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IAnnouncementsDto } from './get-announcements.dto';

export class CreateAnnouncementItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  public content: string;
}

export class CreateAnnouncementsDto {
  @IsOptional()
  @MaxLength(255)
  public title?: string | undefined;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  public validFromDate?: Date | undefined;

  public items: CreateAnnouncementItemDto[];
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
