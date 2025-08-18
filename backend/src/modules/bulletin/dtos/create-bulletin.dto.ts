import { VALIDATOR_SETTINGS } from '@config';
import { BaseReqDto, DtoTransformFunctions, events, type IResponse } from '@core';
import { errorKeys } from '@exceptions';
import { IsBulletinSectionValid } from '@validators';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SectionType } from '../enums/bulletin-section-type.enum';

export class CreateBulletinDaySectionDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  public order: number;

  @IsNotEmpty()
  @IsString()
  @IsEnum(SectionType)
  public type: SectionType;

  @IsOptional()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH, { message: errorKeys.bulletin.Section_Title_Too_Long })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public title?: string | null;

  @IsOptional()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_DAY_SECTION_CONTENT_MAX_LENGTH, {
    message: errorKeys.bulletin.Section_Content_Too_Long,
  })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public content?: string | null;

  @IsBulletinSectionValid()
  public validateSection?: boolean = true; // This property is just for validation trigger
}

export class CreateBulletinDayDto {
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  public date: Date;

  @IsOptional()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH, { message: errorKeys.bulletin.Title_Too_Long })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public title?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBulletinDaySectionDto)
  public sections: CreateBulletinDaySectionDto[];
}

export class CreateBulletinDto {
  @IsNotEmpty({ message: errorKeys.bulletin.Title_Is_Required })
  @IsString({ message: errorKeys.bulletin.Title_Must_Be_A_String })
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH, { message: errorKeys.bulletin.Title_Too_Long })
  public title?: string | null;

  @IsNotEmpty({ message: errorKeys.bulletin.Date_Is_Required })
  @Type(() => Date)
  @IsDate({ message: errorKeys.bulletin.Date_Is_Required })
  public date?: Date | null;

  @IsNotEmpty({ message: errorKeys.bulletin.Number_Is_Required })
  @IsInt({ message: errorKeys.bulletin.Number_Is_Required })
  @Min(1, { message: errorKeys.bulletin.Min_Number_Greater_Than_Zero })
  @Max(Number.MAX_SAFE_INTEGER)
  public number?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH)
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public introduction?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH)
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public tipsForWork?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH)
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public dailyPrayer?: string | null;

  @IsOptional()
  @IsArray()
  @Type(() => CreateBulletinDayDto)
  @ValidateNested({ each: true })
  public days?: CreateBulletinDayDto[];
}

export class CreateBulletinReqDto extends BaseReqDto {
  public readonly bulletin: CreateBulletinDto;

  constructor(bulletin: CreateBulletinDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.bulletin = bulletin;
  }
}

export class CreateBulletinResponseDto implements IResponse<string> {
  public readonly data: string;
  public readonly message: string;

  constructor(data: string) {
    this.data = data;
    this.message = events.bulletin.bulletinCreated;
  }
}
