import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUserTaskProgressDto {
  @IsInt()
  public taskId: number;

  @IsBoolean()
  public isCompleted: boolean;

  @IsOptional()
  @IsString()
  public comment?: string;
}
