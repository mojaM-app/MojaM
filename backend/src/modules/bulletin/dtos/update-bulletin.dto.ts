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
import { BulletinDaySettingsDto, BulletinSectionSettingsDto } from './settings.dto';
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
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public title?: string | null;

  @IsOptional()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_DAY_SECTION_CONTENT_MAX_LENGTH, {
    message: errorKeys.bulletin.Section_Content_Too_Long,
  })
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public content?: string | null;

  @IsNotEmpty()
  @IsString()
  @IsEnum(SectionType)
  public type!: SectionType;

  @IsBulletinSectionValid()
  public validateSection?: boolean = true;

  @IsNotEmpty()
  @Type(() => BulletinSectionSettingsDto)
  @ValidateNested()
  public settings!: BulletinSectionSettingsDto;

  constructor() {
    this.content = null;
  }
}

export class UpdateBulletinDayDto {
  public id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH)
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public title?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public date?: Date | null;

  @IsOptional()
  @Type(() => BulletinDaySettingsDto)
  @ValidateNested()
  public settings?: BulletinDaySettingsDto | null;

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
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public title?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public date?: Date | null;

  @IsOptional()
  @IsString({ message: errorKeys.bulletin.Number_Is_Required })
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_NUMBER_MAX_LENGTH)
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public number?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH)
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public introduction?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH)
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public tipsForWork?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH)
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
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
