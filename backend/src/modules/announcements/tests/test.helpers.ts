import { generateRandomDate, generateRandomString } from '@utils';
import { type CreateAnnouncementItemDto, type CreateAnnouncementsDto } from '../dtos/create-announcements.dto';

const generateValidAnnouncements = (): CreateAnnouncementsDto => {
  return {
    validFromDate: generateRandomDate(),
    title: generateRandomString(40),
    items: [
      {
        content: `1${generateRandomString(400)}`,
      } satisfies CreateAnnouncementItemDto,
      {
        content: `2${generateRandomString(800)}`,
      } satisfies CreateAnnouncementItemDto,
      {
        content: `3${generateRandomString(1500)}`,
      } satisfies CreateAnnouncementItemDto,
      {
        content: `4${generateRandomString(255)}`,
      } satisfies CreateAnnouncementItemDto,
    ],
  } satisfies CreateAnnouncementsDto;
};

export { generateValidAnnouncements };
