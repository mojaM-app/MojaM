import { events, ILoginModel } from '@core';
import { testHelpers } from '@helpers';
import { getAdminLoginData, getDateNow, isGuid } from '@utils';
import { isDateString } from 'class-validator';
import { generateValidAnnouncements } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateAnnouncementsResponseDto } from '../dtos/create-announcements.dto';
import { GetCurrentAnnouncementsResponseDto, IGetCurrentAnnouncementsDto } from '../dtos/get-current-announcements.dto';
import { PublishAnnouncementsResponseDto } from '../dtos/publish-announcements.dto';
import { CurrentAnnouncementsService } from '../services/current-announcements.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('GET /announcements/current', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await app.auth.loginAs({ email, passcode } satisfies ILoginModel))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('result should be null', () => {
    it('when there is no announcements', async () => {
      const response = await app!.currentAnnouncements.get();
      expect(response.statusCode).toBe(200);
      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: getData, message: getMessage }: GetCurrentAnnouncementsResponseDto = body;
      const { currentAnnouncements, announcementsCount }: IGetCurrentAnnouncementsDto = getData;
      expect(currentAnnouncements).toBeNull();
      expect(announcementsCount).toBe(0);
      expect(getMessage).toBe(events.announcements.currentAnnouncementsRetrieved);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
      expect(testEventHandlers.onCurrentAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
    });

    it('when there are announcements but they have no validFromDate and they are not published', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = undefined;
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      const { data: announcementsId }: CreateAnnouncementsResponseDto = createAnnouncementsResponse.body;

      const response = await app!.currentAnnouncements.get();
      expect(response.statusCode).toBe(200);
      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: getData, message: getMessage }: GetCurrentAnnouncementsResponseDto = body;
      const { currentAnnouncements, announcementsCount }: IGetCurrentAnnouncementsDto = getData;
      expect(currentAnnouncements).toBeNull();
      expect(announcementsCount).toBe(1);
      expect(getMessage).toBe(events.announcements.currentAnnouncementsRetrieved);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(
              eventHandler,
            ),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCurrentAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    it('when there are announcements and they have today`s validFromDate but they are not published', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = getDateNow();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      const { data: announcementsId }: CreateAnnouncementsResponseDto = createAnnouncementsResponse.body;

      const response = await app!.currentAnnouncements.get();
      expect(response.statusCode).toBe(200);
      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: getData, message: getMessage }: GetCurrentAnnouncementsResponseDto = body;
      const { currentAnnouncements, announcementsCount }: IGetCurrentAnnouncementsDto = getData;
      expect(currentAnnouncements).toBeNull();
      expect(announcementsCount).toBe(1);
      expect(getMessage).toBe(events.announcements.currentAnnouncementsRetrieved);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(
              eventHandler,
            ),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCurrentAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    it('when there are published announcements but they valid since tomorrow', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = getDateNow().addDays(1);
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      const { data: announcementsId }: CreateAnnouncementsResponseDto = createAnnouncementsResponse.body;

      const publishAnnouncementsResponse = await app!.announcements.publish(announcementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);
      const { data: publishResult }: PublishAnnouncementsResponseDto = publishAnnouncementsResponse.body;
      expect(publishResult).toBe(true);

      const response = await app!.currentAnnouncements.get();
      expect(response.statusCode).toBe(200);
      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: getData, message: getMessage }: GetCurrentAnnouncementsResponseDto = body;
      const { currentAnnouncements, announcementsCount }: IGetCurrentAnnouncementsDto = getData;
      expect(currentAnnouncements).toBeNull();
      expect(announcementsCount).toBe(1);
      expect(getMessage).toBe(events.announcements.currentAnnouncementsRetrieved);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      expect(testEventHandlers.onCurrentAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(0);
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('result should not be null', () => {
    it('when there are one published announcements with validFromDate=6_days_ago and one unpublish with validFromDate=today_s_date', async () => {
      const requestData1 = generateValidAnnouncements();
      // 6 days ago
      requestData1.validFromDate = getDateNow().addDays(-6);
      const createAnnouncements1Response = await app!.announcements.create(requestData1, adminAccessToken);
      expect(createAnnouncements1Response.statusCode).toBe(201);
      const { data: createdAnnouncements1Id }: CreateAnnouncementsResponseDto = createAnnouncements1Response.body;

      const publishAnnouncements1Response = await app!.announcements.publish(createdAnnouncements1Id, adminAccessToken);
      expect(publishAnnouncements1Response.statusCode).toBe(200);
      const { data: publishResult }: PublishAnnouncementsResponseDto = publishAnnouncements1Response.body;
      expect(publishResult).toBe(true);

      const requestData2 = generateValidAnnouncements();
      // today
      requestData2.validFromDate = getDateNow();
      const createAnnouncements2Response = await app!.announcements.create(requestData2, adminAccessToken);
      expect(createAnnouncements2Response.statusCode).toBe(201);
      const { data: createdAnnouncements2Id }: CreateAnnouncementsResponseDto = createAnnouncements2Response.body;

      const response = await app!.currentAnnouncements.get();
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: getData, message: getMessage }: GetCurrentAnnouncementsResponseDto = body;
      expect(getData).not.toBeNull();
      expect(getMessage).toBe(events.announcements.currentAnnouncementsRetrieved);
      const { currentAnnouncements, announcementsCount }: IGetCurrentAnnouncementsDto = getData;
      expect(announcementsCount).toBe(2);
      expect(currentAnnouncements).toBeDefined();
      expect(currentAnnouncements!.id).toBeDefined();
      expect(isGuid(currentAnnouncements!.id)).toBe(true);
      expect(currentAnnouncements!.id).toBe(createdAnnouncements1Id);
      expect(currentAnnouncements!.createdBy.length).toBeGreaterThan(0);
      expect(currentAnnouncements!.createdAt).toBeDefined();
      expect(isDateString(currentAnnouncements!.createdAt)).toBe(true);
      expect(currentAnnouncements!.updatedAt).toBeDefined();
      expect(isDateString(currentAnnouncements!.updatedAt)).toBe(true);
      expect(currentAnnouncements?.title).toBe(requestData1.title);
      expect(currentAnnouncements?.publishedAt).toBeDefined();
      expect(currentAnnouncements?.publishedBy.length).toBeGreaterThan(0);
      expect(new Date(currentAnnouncements!.validFromDate).toDateString()).toBe(
        requestData1.validFromDate.toDateString(),
      );
      expect(currentAnnouncements?.items).toBeDefined();
      expect(currentAnnouncements?.items.length).toBe(requestData1.items!.length);
      expect(currentAnnouncements!.items.every(item => isGuid(item.id))).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.content !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.updatedBy === undefined)).toBe(true);
      requestData1.items!.forEach((item, index) => {
        expect(currentAnnouncements!.items[index].content).toBe(item.content);
      });
      // cleanup
      const deleteAnnouncements1Response = await app!.announcements.delete(createdAnnouncements1Id, adminAccessToken);
      expect(deleteAnnouncements1Response.statusCode).toBe(200);

      const deleteAnnouncements2Response = await app!.announcements.delete(createdAnnouncements2Id, adminAccessToken);
      expect(deleteAnnouncements2Response.statusCode).toBe(200);

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
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onCurrentAnnouncementsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(2);
    });

    it('when there are one published announcements with today date', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = getDateNow();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      const { data: createdAnnouncementsId }: CreateAnnouncementsResponseDto = createAnnouncementsResponse.body;

      const publishAnnouncementsResponse = await app!.announcements.publish(createdAnnouncementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);
      const { data: publishResult }: PublishAnnouncementsResponseDto = publishAnnouncementsResponse.body;
      expect(publishResult).toBe(true);

      const response = await app!.currentAnnouncements.get();
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: getData, message: getMessage }: GetCurrentAnnouncementsResponseDto = body;
      expect(getData).not.toBeNull();
      expect(getMessage).toBe(events.announcements.currentAnnouncementsRetrieved);
      const { currentAnnouncements, announcementsCount }: IGetCurrentAnnouncementsDto = getData;
      expect(announcementsCount).toBe(1);
      expect(currentAnnouncements).toBeDefined();
      expect(currentAnnouncements!.id).toBeDefined();
      expect(isGuid(currentAnnouncements!.id)).toBe(true);
      expect(currentAnnouncements!.id).toBe(createdAnnouncementsId);
      expect(currentAnnouncements!.createdBy.length).toBeGreaterThan(0);
      expect(currentAnnouncements!.createdAt).toBeDefined();
      expect(isDateString(currentAnnouncements!.createdAt)).toBe(true);
      expect(currentAnnouncements!.updatedAt).toBeDefined();
      expect(isDateString(currentAnnouncements!.updatedAt)).toBe(true);
      expect(currentAnnouncements?.title).toBe(requestData.title);
      expect(currentAnnouncements?.publishedAt).toBeDefined();
      expect(isDateString(currentAnnouncements!.publishedAt)).toBe(true);
      expect(currentAnnouncements?.publishedBy?.length).toBeGreaterThan(0);
      expect(currentAnnouncements!.validFromDate).toBe(requestData.validFromDate.toISOString());
      expect(currentAnnouncements?.items).toBeDefined();
      expect(currentAnnouncements?.items.length).toBe(requestData.items!.length);
      expect(currentAnnouncements!.items.every(item => isGuid(item.id))).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.content !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(currentAnnouncements!.items.every(item => item.updatedBy === undefined)).toBe(true);
      requestData.items!.forEach((item, index) => {
        expect(currentAnnouncements!.items[index].content).toBe(item.content);
      });
      expect(getMessage).toBe(events.announcements.currentAnnouncementsRetrieved);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(createdAnnouncementsId, adminAccessToken);
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

  describe('GET should handle error', () => {
    test('when error occurs in the process', async () => {
      jest
        .spyOn(CurrentAnnouncementsService.prototype, 'get')
        .mockImplementation(async (_currentUserId: number | undefined) => {
          throw new Error('Test error');
        });

      const getAnnouncementsListResponse = await app!.currentAnnouncements.get();
      expect(getAnnouncementsListResponse.statusCode).toBe(500);
      const body = getAnnouncementsListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe('Test error');

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
