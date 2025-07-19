import { IsBoolean, IsInt } from 'class-validator';

export class UpdateUserBulletinProgressDto {
  @IsInt()
  public bulletinId: number;

  @IsInt()
  public dayNumber: number;

  @IsBoolean()
  public isCompleted: boolean;
}
