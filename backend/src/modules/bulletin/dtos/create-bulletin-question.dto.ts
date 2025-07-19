import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { BulletinQuestionTypeType } from '../enums/bulletin-question-type.enum';

export class CreateBulletinQuestionDto {
  @IsInt()
  public bulletinDayId: number;

  @IsInt()
  public questionType: BulletinQuestionTypeType;

  @IsString()
  @IsNotEmpty()
  public content: string;
}
