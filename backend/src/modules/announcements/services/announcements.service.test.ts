import { CreateAnnouncementsReqDto } from '../dtos/create-announcements.dto';
import { UpdateAnnouncementsDto, UpdateAnnouncementsReqDto } from '../dtos/update-announcements.dto';
import { AnnouncementsService } from './announcements.service';

describe('UserRepository tests', () => {
  const service: AnnouncementsService = new AnnouncementsService();

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  describe('update tests', () => {
    test('should return null when reqDto.announcementsId is null', async () => {
      const result = await service.update({
        announcementsId: null as any,
        announcements: {
          title: 'title',
          validFromDate: new Date(),
          items: [],
        } satisfies UpdateAnnouncementsDto,
        currentUserId: undefined,
      } satisfies UpdateAnnouncementsReqDto);
      expect(result).toBeNull();
    });

    test('should return null when reqDto.announcementsId is undefined', async () => {
      const result = await service.update({
        announcementsId: undefined,
        announcements: {
          title: 'title',
          validFromDate: new Date(),
          items: [],
        } satisfies UpdateAnnouncementsDto,
        currentUserId: undefined,
      } satisfies UpdateAnnouncementsReqDto);
      expect(result).toBeNull();
    });

    test('should return null when reqDto.announcements is null', async () => {
      const result = await service.update({
        announcementsId: 'announcementsId',
        announcements: null as any,
        currentUserId: undefined,
      } satisfies UpdateAnnouncementsReqDto);
      expect(result).toBeNull();
    });

    test('should return null when reqDto.announcements is undefined', async () => {
      const result = await service.update({
        announcementsId: 'announcementsId',
        announcements: undefined as any,
        currentUserId: undefined,
      } satisfies UpdateAnnouncementsReqDto);
      expect(result).toBeNull();
    });
  });

  describe('create tests', () => {
    test('should return null when reqDto.announcements is null', async () => {
      const result = await service.create({
        announcements: null as any,
        currentUserId: undefined,
      } satisfies CreateAnnouncementsReqDto);
      expect(result).toBeNull();
    });

    test('should return null when reqDto.announcements is undefined', async () => {
      const result = await service.create({
        announcements: undefined as any,
        currentUserId: undefined,
      } satisfies CreateAnnouncementsReqDto);
      expect(result).toBeNull();
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
