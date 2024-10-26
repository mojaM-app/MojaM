import { getDateNow } from '@utils/date.utils';
import { generateRandomString } from '@utils/tests.utils';
import { CreateAnnouncementItemDto, CreateAnnouncementsDto } from '../dtos/create-announcements.dto';

const generateValidAnnouncements = (): CreateAnnouncementsDto => {
  return {
    validFromDate: getDateNow(),
    items: [
      {
        content: generateRandomString(400),
      } satisfies CreateAnnouncementItemDto,
      {
        content: generateRandomString(800),
      } satisfies CreateAnnouncementItemDto,
      {
        content: generateRandomString(1500),
      } satisfies CreateAnnouncementItemDto,
      {
        content: generateRandomString(255),
      } satisfies CreateAnnouncementItemDto,
    ],
  } satisfies CreateAnnouncementsDto;
};

export { generateValidAnnouncements };
