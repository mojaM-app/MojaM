import { generateRandomDate, generateRandomString } from '@utils/tests.utils';
import { CreateAnnouncementItemDto, CreateAnnouncementsDto } from '../dtos/create-announcements.dto';

const generateValidAnnouncements = (): CreateAnnouncementsDto => {
  return {
    validFromDate: generateRandomDate(),
    title: generateRandomString(40),
    items: [
      {
        content: '1' + generateRandomString(400),
        setDefaultValues: () => {},
      } satisfies CreateAnnouncementItemDto,
      {
        content: '2' + generateRandomString(800),
        setDefaultValues: () => {},
      } satisfies CreateAnnouncementItemDto,
      {
        content: '3' + generateRandomString(1500),
        setDefaultValues: () => {},
      } satisfies CreateAnnouncementItemDto,
      {
        content: '4' + generateRandomString(255),
        setDefaultValues: () => {},
      } satisfies CreateAnnouncementItemDto,
    ],
    setDefaultValues: () => {},
  } satisfies CreateAnnouncementsDto;
};

export { generateValidAnnouncements };
