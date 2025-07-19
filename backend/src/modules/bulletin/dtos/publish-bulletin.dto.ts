import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class PublishBulletinDto {
  @IsOptional()
  @IsInt()
  public bulletinId?: number;

  @IsOptional()
  @IsDateString()
  public startDate?: Date;

  @IsOptional()
  @IsDateString()
  public endDate?: Date;

  @IsOptional()
  @IsInt()
  public currentUserId?: number;
}
