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

export class CreateBulletinDayTaskDto {
  @IsInt()
  @Min(1)
  public taskOrder: number;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsOptional()
  public hasCommentField?: boolean;
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
  @Type(() => CreateBulletinDayTaskDto)
  public tasks: CreateBulletinDayTaskDto[];
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
  public daysCount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBulletinDayDto)
  public days: CreateBulletinDayDto[];

  @IsOptional()
  @IsInt()
  public currentUserId?: number;
}
