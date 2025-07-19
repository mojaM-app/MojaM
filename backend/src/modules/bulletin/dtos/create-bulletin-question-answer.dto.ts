import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateBulletinQuestionAnswerDto {
  @IsInt()
  public questionId: number;

  @IsString()
  @IsNotEmpty()
  public content: string;
}
