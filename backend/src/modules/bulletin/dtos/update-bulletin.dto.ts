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
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SectionType } from '../enums/bulletin-section-type.enum';

export class UpdateBulletinDaySectionDto {
  public id?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  public order!: number;

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

  @IsNotEmpty()
  @IsString()
  @IsEnum(SectionType)
  public type!: SectionType;

  @IsBulletinSectionValid()
  public validateSection?: boolean = true;

  constructor() {
    this.content = null;
  }
}

export class UpdateBulletinDayDto {
  public id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH)
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public title?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public date?: Date | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBulletinDaySectionDto)
  public sections?: UpdateBulletinDaySectionDto[] | null;

  constructor() {
    this.sections = [];
  }
}

export class UpdateBulletinDto {
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH, { message: errorKeys.bulletin.Title_Too_Long })
  @Transform(DtoTransformFunctions.getEmptyStringIfNotSet)
  public title?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public date?: Date | null;

  @IsOptional()
  @IsPositive()
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
  @ValidateNested({ each: true })
  @Type(() => UpdateBulletinDayDto)
  public days?: UpdateBulletinDayDto[] | null;

  constructor() {
    this.days = [];
  }
}

export class UpdateBulletinReqDto extends BaseReqDto {
  public readonly bulletinId: string | undefined;
  public readonly bulletin: UpdateBulletinDto;

  constructor(bulletinId: string | undefined, bulletin: UpdateBulletinDto, currentUserId: number) {
    super(currentUserId);
    this.bulletinId = bulletinId;
    this.bulletin = bulletin;
  }
}

export class UpdateBulletinResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message: string;

  constructor(data: boolean) {
    this.data = data;
    this.message = events.bulletin.bulletinUpdated;
  }
}
