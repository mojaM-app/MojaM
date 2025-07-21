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

export class UpdateBulletinTaskDto {
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

export class UpdateBulletinDayDto {
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
  @Type(() => UpdateBulletinTaskDto)
  public tasks: UpdateBulletinTaskDto[];

  constructor() {
    this.dayNumber = 1;
    this.instructions = '';
    this.tasks = [];
  }
}

export class UpdateBulletinDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public title?: string;

  @IsOptional()
  @IsDateString()
  public startDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  public daysCount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBulletinDayDto)
  public days?: UpdateBulletinDayDto[];

  constructor() {
    // Optional fields don't need initialization
  }
}

export class UpdateBulletinReqDto extends BaseReqDto {
  public readonly bulletinUuid: string;
  public readonly bulletin: UpdateBulletinDto;

  constructor(bulletinUuid: string, bulletin: UpdateBulletinDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.bulletinUuid = bulletinUuid;
    this.bulletin = bulletin;
  }
}

export class UpdateBulletinResponseDto implements IResponse<string> {
  public readonly data: string;
  public readonly message: string;

  constructor(data: string) {
    this.data = data;
    this.message = events.bulletin.bulletinUpdated;
  }
}
