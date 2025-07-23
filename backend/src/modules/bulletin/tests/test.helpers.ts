import { generateRandomString } from '@utils';
import { CreateBulletinQuestionDto } from '../dtos/create-bulletin-question.dto';
import { CreateBulletinDayDto, CreateBulletinDto, CreateBulletinTaskDto } from '../dtos/create-bulletin.dto';
import { BulletinQuestionTypeValue } from '../enums/bulletin-question-type.enum';

export function generateValidBulletin(): CreateBulletinDto {
  const startDate = new Date();
  const bulletin = new CreateBulletinDto();
  bulletin.title = `Test Bulletin ${generateRandomString(8)}`;
  bulletin.startDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  bulletin.daysCount = 7;

  const day = new CreateBulletinDayDto();
  day.dayNumber = 1;
  day.introduction = `Introduction for day 1`;
  day.instructions = `Instructions for day 1`;

  const task = new CreateBulletinTaskDto();
  task.taskOrder = 1;
  task.description = `Task 1 for day 1`;
  task.hasCommentField = false;

  day.tasks = [task];
  bulletin.days = [day];

  return bulletin;
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
