import { VALIDATOR_SETTINGS } from '@config';
import { BaseReqDto, events, type IResponse } from '@core';
import { errorKeys } from '@exceptions';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateBulletinTaskDto {
  @IsInt()
  @Min(1)
  public taskOrder: number;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsOptional()
  public hasCommentField?: boolean = false;

  constructor() {
    this.taskOrder = 1;
    this.description = '';
  }
}

export class CreateBulletinDayDto {
  @IsInt()
  @Min(1)
  public dayNumber: number;

  @IsOptional()
  @IsString()
  public introduction?: string;

  @IsString()
  @IsNotEmpty()
  public instructions: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBulletinTaskDto)
  public tasks: CreateBulletinTaskDto[];

  constructor() {
    this.dayNumber = 1;
    this.instructions = '';
    this.tasks = [];
  }
}

export class CreateBulletinDto {
  @IsOptional()
  @MaxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH, { message: errorKeys.bulletin.Title_Too_Long })
  public title?: string | undefined;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public startDate?: Date | null;
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
