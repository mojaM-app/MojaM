import { generateRandomString } from '@utils';
import { CreateBulletinQuestionDto } from '../dtos/create-bulletin-question.dto';
import { CreateBulletinDayDto, CreateBulletinDayTaskDto, CreateBulletinDto } from '../dtos/create-bulletin.dto';
import { BulletinQuestionTypeValue } from '../enums/bulletin-question-type.enum';

export function generateValidBulletin(daysOffset: number = 365): CreateBulletinDto {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + daysOffset);

  return {
    title: `Test Bulletin ${generateRandomString(8)}`,
    startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
    daysCount: 7,
    days: [
      {
        dayNumber: 1,
        introduction: `Introduction for day 1`,
        instructions: `Instructions for day 1`,
        tasks: [
          {
            taskOrder: 1,
            description: `Task 1 for day 1`,
            hasCommentField: false,
          },
        ],
      },
    ],
  };
}

export const generateValidBulletinQuestion = (bulletinDayId: number): CreateBulletinQuestionDto => {
  return {
    bulletinDayId,
    questionType: BulletinQuestionTypeValue.Private,
    content: `Test question ${generateRandomString(10)}?`,
  };
};

export const generateValidBulletinQuestionPublic = (bulletinDayId: number): CreateBulletinQuestionDto => {
  return {
    bulletinDayId,
    questionType: BulletinQuestionTypeValue.Public,
    content: `Test public question ${generateRandomString(10)}?`,
  };
};
