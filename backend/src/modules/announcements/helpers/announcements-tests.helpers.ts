import { generateRandomDate, generateRandomString } from '@utils/tests.utils';
import { CreateAnnouncementItemDto, CreateAnnouncementsDto } from '../dtos/create-announcements.dto';

const generateValidAnnouncements = (): CreateAnnouncementsDto => {
  return {
    validFromDate: generateRandomDate(),
    title: generateRandomString(40),
    items: [
      {
        content: generateRandomString(400),
        setDefaultValues: () => {},
      } satisfies CreateAnnouncementItemDto,
      {
        content: generateRandomString(800),
        setDefaultValues: () => {},
      } satisfies CreateAnnouncementItemDto,
      {
        content: generateRandomString(1500),
        setDefaultValues: () => {},
      } satisfies CreateAnnouncementItemDto,
      {
        content: generateRandomString(255),
        setDefaultValues: () => {},
      } satisfies CreateAnnouncementItemDto,
    ],
    setDefaultValues: () => {},
  } satisfies CreateAnnouncementsDto;
};

export { generateValidAnnouncements };
