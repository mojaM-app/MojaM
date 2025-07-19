export interface BulletinQuestionResponseDto {
  id: number;
  bulletinDayId: number;
  userId: number;
  questionType: number;
  content: string;
  createdAt: string;
  modifiedAt: string;
  canBeEdited: boolean;
  answers: BulletinQuestionAnswerResponseDto[];
}

export interface BulletinQuestionAnswerResponseDto {
  id: number;
  questionId: number;
  userId: number;
  content: string;
  createdAt: string;
}
