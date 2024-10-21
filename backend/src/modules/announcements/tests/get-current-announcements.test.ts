/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService } from '@events';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { AnnouncementsRout, GetCurrentAnnouncementsResponseDto } from '@modules/announcements';
import { EventDispatcher } from 'event-dispatch';
import request from 'supertest';

describe('GET /announcements/current', () => {
  const announcementRoute = new AnnouncementsRout();
  const app = new App();

  beforeAll(async () => {
    await app.initialize([announcementRoute]);

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('when there is no announcement', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('when there is no announcement result should be null (user not authenticated)', async () => {
      const response = await request(app.getServer()).get(announcementRoute.currentAnnouncementsPath).send();
      expect(response.statusCode).toBe(200);
      const body: GetCurrentAnnouncementsResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toBeNull();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onAnnouncementsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
