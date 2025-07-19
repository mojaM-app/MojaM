import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class UpdateBulletinDayTaskDto {
  @IsOptional()
  @IsInt()
  public id?: number;

  @IsInt()
  @Min(1)
  public taskOrder: number;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsOptional()
  public hasCommentField?: boolean;
}

export class UpdateBulletinDayDto {
  @IsOptional()
  @IsInt()
  public id?: number;

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
  @Type(() => UpdateBulletinDayTaskDto)
  public tasks: UpdateBulletinDayTaskDto[];
}

export class UpdateBulletinDto {
  @IsOptional()
  @IsInt()
  public bulletinId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public title?: string;

  @IsOptional()
  @IsDateString()
  public startDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBulletinDayDto)
  public days?: UpdateBulletinDayDto[];

  @IsOptional()
  @IsInt()
  public currentUserId?: number;
}
