import { generateRandomDate, generateRandomString } from '@utils';
import {
  type CreateBulletinDayDto,
  type CreateBulletinDaySectionDto,
  type CreateBulletinDto,
} from '../dtos/create-bulletin.dto';
import {
  type UpdateBulletinDayDto,
  type UpdateBulletinDaySectionDto,
  type UpdateBulletinDto,
} from '../dtos/update-bulletin.dto';
import { SectionType } from '../enums/bulletin-section-type.enum';

const generateValidBulletin = (): CreateBulletinDto => {
  const bulletinDate = generateRandomDate();
  return {
    title: generateRandomString(40),
    date: bulletinDate,
    number: Math.floor(Math.random() * 999) + 1,
    introduction: generateRandomString(500),
    tipsForWork: generateRandomString(300),
    dailyPrayer: generateRandomString(200),
    days: [
      {
        date: bulletinDate,
        title: 'Day1',
        sections: [
          {
            order: 1,
            type: SectionType.CUSTOM_TEXT,
            title: 'Day1 Section1',
            content: generateRandomString(100),
          } satisfies CreateBulletinDaySectionDto,
          {
            order: 2,
            type: SectionType.CUSTOM_TEXT,
            title: 'Day1 Section2',
            content: generateRandomString(80),
          } satisfies CreateBulletinDaySectionDto,
        ],
      } satisfies CreateBulletinDayDto,
      {
        date: bulletinDate.addDays(1),
        title: 'Day2',
        sections: [
          {
            order: 1,
            type: SectionType.CUSTOM_TEXT,
            title: 'Day2 Section1',
            content: generateRandomString(1200),
          } satisfies CreateBulletinDaySectionDto,
        ],
      } satisfies CreateBulletinDayDto,
    ],
  } satisfies CreateBulletinDto;
};

const generateValidUpdateBulletin = (): UpdateBulletinDto => {
  const bulletinDate = generateRandomDate();
  return {
    title: generateRandomString(40),
    number: Math.floor(Math.random() * 999) + 1,
    date: bulletinDate,
    introduction: generateRandomString(500),
    dailyPrayer: generateRandomString(200),
    tipsForWork: generateRandomString(300),
    days: [
      {
        title: generateRandomString(30),
        date: bulletinDate,
        sections: [
          {
            title: generateRandomString(50),
            content: generateRandomString(100),
            type: SectionType.CUSTOM_TEXT,
            order: 1,
          } satisfies UpdateBulletinDaySectionDto,
          {
            title: generateRandomString(40),
            content: generateRandomString(800),
            type: SectionType.CUSTOM_TEXT,
            order: 2,
          } satisfies UpdateBulletinDaySectionDto,
        ],
      } satisfies UpdateBulletinDayDto,
    ],
  };
};

export { generateValidBulletin, generateValidUpdateBulletin };
