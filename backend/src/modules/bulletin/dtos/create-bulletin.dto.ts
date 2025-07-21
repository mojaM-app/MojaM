import { BaseReqDto, events, type IResponse } from '@core';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
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
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsDateString()
  public startDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  public daysCount?: number = 7;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBulletinDayDto)
  public days: CreateBulletinDayDto[];

  constructor() {
    this.title = '';
    this.startDate = '';
    this.days = [];
  }
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
