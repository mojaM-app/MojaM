/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { loginAs } from '@helpers/user-tests.helpers';
import {
  AnnouncementsRout,
  CreateAnnouncementsResponseDto,
  GetCurrentAnnouncementsResponseDto,
  PublishAnnouncementsResponseDto,
} from '@modules/announcements';
import { LoginDto } from '@modules/auth';
import { getDateNow, isGuid } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { isDateString } from 'class-validator';
import { EventDispatcher } from 'event-dispatch';
import request from 'supertest';
import { generateValidAnnouncements } from '../helpers/announcements-tests.helpers';

describe('GET /announcements/current', () => {
  const announcementRoute = new AnnouncementsRout();
  const app = new App();

  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    await app.initialize([announcementRoute]);

    const { email: login, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email: login, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('result should be null ...', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('when there is no announcements', async () => {
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

    it('when there are announcements but they have no validFromDate and they are not published', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = undefined;
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      const { data: announcements }: CreateAnnouncementsResponseDto = createAnnouncementsResponse.body;

      const response = await request(app.getServer()).get(announcementRoute.currentAnnouncementsPath).send();
      expect(response.statusCode).toBe(200);
      const body: GetCurrentAnnouncementsResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toBeNull();

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcements!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    it('when there are announcements and they have today`s validFromDate but they are not published', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = getDateNow();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      const { data: announcements }: CreateAnnouncementsResponseDto = createAnnouncementsResponse.body;

      const response = await request(app.getServer()).get(announcementRoute.currentAnnouncementsPath).send();
      expect(response.statusCode).toBe(200);
      const body: GetCurrentAnnouncementsResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toBeNull();

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcements!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    it('when there are published announcements but they valid since tomorrow', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = new Date(getDateNow().getTime() + 24 * 60 * 60 * 1000);
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      const { data: announcements }: CreateAnnouncementsResponseDto = createAnnouncementsResponse.body;

      const publishAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path + '/' + announcements!.id + '/' + announcementRoute.publishPath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);
      const { data: publishResult }: PublishAnnouncementsResponseDto = publishAnnouncementsResponse.body;
      expect(publishResult).toBe(true);

      const response = await request(app.getServer()).get(announcementRoute.currentAnnouncementsPath).send();
      expect(response.statusCode).toBe(200);
      const body: GetCurrentAnnouncementsResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toBeNull();

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcements!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsPublished,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('result shouldn`t be null', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('when there are published announcements with today`s date', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = getDateNow();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      const { data: createdAnnouncements }: CreateAnnouncementsResponseDto = createAnnouncementsResponse.body;

      const publishAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path + '/' + createdAnnouncements!.id + '/' + announcementRoute.publishPath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);
      const { data: publishResult }: PublishAnnouncementsResponseDto = publishAnnouncementsResponse.body;
      expect(publishResult).toBe(true);

      const response = await request(app.getServer()).get(announcementRoute.currentAnnouncementsPath).send();
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: currentAnnouncements, message: getMessage }: GetCurrentAnnouncementsResponseDto = body;
      expect(currentAnnouncements).toBeDefined();
      expect(currentAnnouncements!.id).toBeDefined();
      expect(isGuid(currentAnnouncements!.id)).toBe(true);
      expect(currentAnnouncements!.id).toBe(createdAnnouncements!.id);
      expect(currentAnnouncements!.createdBy).toBeDefined();
      expect(currentAnnouncements!.createdAt).toBeDefined();
      expect(isDateString(currentAnnouncements!.createdAt)).toBe(true);
      expect(currentAnnouncements!.updatedAt).toBeDefined();
      expect(isDateString(currentAnnouncements!.updatedAt)).toBe(true);
      expect(currentAnnouncements?.title).toBe(requestData.title);
      expect(currentAnnouncements?.publishedAt).toBeDefined();
      expect(currentAnnouncements?.publishedBy).toBeDefined();
      expect(currentAnnouncements!.validFromDate).toBe(requestData.validFromDate.toISOString());
      expect(currentAnnouncements?.items).toBeDefined();
      expect(currentAnnouncements?.items.length).toBe(requestData.items!.length);
      expect(currentAnnouncements!.items.every(item => isGuid(item.id))).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.content !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.updatedBy === undefined)).toBe(true);
      expect(getMessage).toBe(events.announcements.currentAnnouncementsRetrieved);

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + createdAnnouncements!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsPublished,
              testEventHandlers.onCurrentAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onCurrentAnnouncementsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
