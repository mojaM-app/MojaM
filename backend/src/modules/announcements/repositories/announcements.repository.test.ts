import { AnnouncementsRepository } from './announcements.repository';

describe('AnnouncementsRepository tests', () => {
  const repository: AnnouncementsRepository = new AnnouncementsRepository();

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  describe('getIdByUuid tests', () => {
    test('should return undefined when Uuid is null', async () => {
      const id = await repository.getIdByUuid(null);
      expect(id).toBeUndefined();
    });

    test('should return undefined when Uuid is undefined', async () => {
      const id = await repository.getIdByUuid(undefined);
      expect(id).toBeUndefined();
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
