import { VALIDATOR_SETTINGS } from '@config';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-tests.helper';
import { generateValidUserWithPassword, loginAs } from '@helpers/user-tests.helpers';
import { AnnouncementsRout, AnnouncementStateValue, CreateAnnouncementsResponseDto, GetAnnouncementsResponseDto } from '@modules/announcements';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermissions } from '@modules/permissions';
import { CreateUserResponseDto, UserRoute } from '@modules/users';
import { isGuid, isNumber } from '@utils';
import { generateRandomDate, getAdminLoginData } from '@utils/tests.utils';
import { isDateString } from 'class-validator';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { App } from './../../../app';
import { generateValidAnnouncements } from './announcements-tests.helper';

describe('POST /announcements', () => {
  const announcementRoute = new AnnouncementsRout();
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let mockSendMail: any;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute, announcementRoute]);
    const { email, passcode } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, passcode } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    mockSendMail = jest.fn().mockImplementation((mailOptions: any, callback: (error: any, info: any) => void) => {
      callback(null, null);
    });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
      close: jest.fn().mockImplementation(() => {}),
    } as any);
  });

  describe('POST should respond with a status code of 201 when data are valid and user has permission', () => {
    test('create unpublished announcement', async () => {
      const requestData = generateValidAnnouncements();
      requestData.title = 'a'.repeat(VALIDATOR_SETTINGS.ANNOUNCEMENTS_TITLE_MAX_LENGTH);
      requestData.items![0].content = 'a'.repeat(VALIDATOR_SETTINGS.ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH);

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      const getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcements).toBeDefined();
      expect(announcements.id).toBeDefined();
      expect(isGuid(announcements.id)).toBe(true);
      expect(announcements.createdBy).toBeDefined();
      expect(announcements.createdAt).toBeDefined();
      expect(isDateString(announcements.createdAt)).toBe(true);
      expect(announcements.updatedAt).toBeDefined();
      expect(isDateString(announcements.updatedAt)).toBe(true);
      expect(announcements.createdAt).toBe(announcements.updatedAt);
      expect(announcements.title).toBe(requestData.title);
      expect(announcements.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcements.publishedAt).toBeUndefined();
      expect(announcements.publishedBy).toBeUndefined();
      expect(new Date(announcements.validFromDate!).toDateString()).toEqual(requestData.validFromDate!.toDateString());
      expect(announcements.items).toBeDefined();
      expect(Array.isArray(announcements.items)).toBe(true);
      expect(announcements.items.length).toBe(requestData.items!.length);
      expect(announcements.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcements.items.every(item => item.content !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.updatedBy === undefined)).toBe(true);
      requestData.items!.forEach((item, index) => {
        expect(announcements.items[index].content).toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('create unpublished announcement with title and validFromDate equal undefined', async () => {
      const requestData = generateValidAnnouncements();
      requestData.title = undefined;
      requestData.validFromDate = undefined;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(createMessage).toBe(events.announcements.announcementsCreated);
      expect(announcementsId).toBeDefined();

      const getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcements).toBeDefined();
      expect(announcements.id).toBeDefined();
      expect(isGuid(announcements.id)).toBe(true);
      expect(announcements.createdBy).toBeDefined();
      expect(announcements.createdAt).toBeDefined();
      expect(isDateString(announcements.createdAt)).toBe(true);
      expect(announcements.updatedAt).toBeDefined();
      expect(isDateString(announcements.updatedAt)).toBe(true);
      expect(announcements.createdAt).toBe(announcements.updatedAt);
      expect(announcements?.title).toBeUndefined();
      expect(announcements?.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcements?.publishedAt).toBeUndefined();
      expect(announcements?.publishedBy).toBeUndefined();
      expect(announcements?.validFromDate).toBeNull();
      expect(announcements?.items).toBeDefined();
      expect(Array.isArray(announcements.items)).toBe(true);
      expect(announcements?.items.length).toBe(requestData.items!.length);
      expect(announcements.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcements.items.every(item => item.content !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.updatedBy === undefined)).toBe(true);
      requestData.items!.forEach((item, index) => {
        expect(announcements.items[index].content).toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('create unpublished announcement with title and validFromDate equal null', async () => {
      const requestData = generateValidAnnouncements();
      requestData.title = null as any;
      requestData.validFromDate = null as any;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(createMessage).toBe(events.announcements.announcementsCreated);
      expect(announcementsId).toBeDefined();

      const getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcements).toBeDefined();
      expect(announcements.id).toBeDefined();
      expect(isGuid(announcements.id)).toBe(true);
      expect(announcements.createdBy).toBeDefined();
      expect(announcements.createdAt).toBeDefined();
      expect(isDateString(announcements.createdAt)).toBe(true);
      expect(announcements.updatedAt).toBeDefined();
      expect(isDateString(announcements.updatedAt)).toBe(true);
      expect(announcements.createdAt).toBe(announcements.updatedAt);
      expect(announcements?.title).toBeUndefined();
      expect(announcements?.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcements?.publishedAt).toBeUndefined();
      expect(announcements?.publishedBy).toBeUndefined();
      expect(announcements?.validFromDate).toBeNull();
      expect(announcements?.items).toBeDefined();
      expect(Array.isArray(announcements.items)).toBe(true);
      expect(announcements?.items.length).toBe(requestData.items!.length);
      expect(announcements.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcements.items.every(item => item.content !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcements.items.every(item => item.updatedBy === undefined)).toBe(true);
      requestData.items!.forEach((item, index) => {
        expect(announcements.items[index].content).toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('create many unpublished announcement with same title', async () => {
      const requestData = generateValidAnnouncements();
      requestData.title = 'Title';

      let createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements1Id }: CreateAnnouncementsResponseDto = body;
      expect(announcements1Id).toBeDefined();

      requestData.validFromDate = generateRandomDate();
      createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements2Id }: CreateAnnouncementsResponseDto = body;
      expect(announcements2Id).toBeDefined();

      // cleanup
      let deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcements1Id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcements2Id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(2);
    });

    test('create unpublished announcement without items', async () => {
      const requestData = generateValidAnnouncements();
      requestData.items = undefined;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(createMessage).toBe(events.announcements.announcementsCreated);
      expect(announcementsId).toBeDefined();

      const getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcements).toBeDefined();
      expect(announcements.id).toBeDefined();
      expect(isGuid(announcements.id)).toBe(true);
      expect(announcements.createdBy).toBeDefined();
      expect(announcements.createdAt).toBeDefined();
      expect(isDateString(announcements.createdAt)).toBe(true);
      expect(announcements.updatedAt).toBeDefined();
      expect(isDateString(announcements.updatedAt)).toBe(true);
      expect(announcements.createdAt).toBe(announcements.updatedAt);
      expect(announcements.title).toBe(requestData.title);
      expect(announcements.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcements.publishedAt).toBeUndefined();
      expect(announcements.publishedBy).toBeUndefined();
      expect(new Date(announcements.validFromDate!).toDateString()).toEqual(requestData.validFromDate!.toDateString());
      expect(announcements.items).toBeDefined();
      expect(Array.isArray(announcements.items)).toBe(true);
      expect(announcements?.items.length).toBe(0);

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcements.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 400', () => {
    test('when title is too long', async () => {
      const requestData = generateValidAnnouncements();
      requestData.title = 'a'.repeat(VALIDATOR_SETTINGS.ANNOUNCEMENTS_TITLE_MAX_LENGTH + 1);

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(400);
      const data = createAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Title_Too_Long).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when item content is too long', async () => {
      const requestData = generateValidAnnouncements();
      requestData.items![0].content = 'a'.repeat(VALIDATOR_SETTINGS.ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH + 1);

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(400);
      const data = createAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Too_Long).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when item content is empty', async () => {
      const requestData = generateValidAnnouncements();
      requestData.items![0].content = '';

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(400);
      const data = createAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Is_Required).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when item content is null', async () => {
      const requestData = generateValidAnnouncements();
      requestData.items![0].content = null as any;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(400);
      const data = createAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Is_Required).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when item content is undefined', async () => {
      const requestData = generateValidAnnouncements();
      requestData.items![0].content = undefined as any;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(400);
      const data = createAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Is_Required).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe.each([
    new Date('2024-03-23'),
    new Date('2024-03-24'),
    new Date('2024-03-25'),
    new Date('2024-03-26'),
    new Date('2024-03-27'),

    new Date('2024-10-24'),
    new Date('2024-10-25'),
    new Date('2024-10-26'),
    new Date('2024-10-27'),
    new Date('2024-10-28'),
  ])('POST should respond with a status code of 400 for date %o', date => {
    test('when creating many unpublished announcement with same validFromDate', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = date;

      let createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(400);
      const data = createAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Announcements_With_Given_ValidFromDate_Already_Exists).length).toBe(0);

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const data = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer()).post(announcementRoute.path).send(data);
      expect(createAnnouncementsResponse.statusCode).toBe(401);
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const userData = generateValidUserWithPassword();
      const newUserResponse = await request(app.getServer()).post(userRoute.path).send(userData).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await loginAs(app, { email: userData.email, passcode: userData.passcode } satisfies LoginDto))?.accessToken;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(403);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when user have all permissions expect AddAnnouncements', async () => {
      const userData = generateValidUserWithPassword();
      const newUserResponse = await request(app.getServer()).post(userRoute.path).send(userData).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.AddAnnouncements) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: userData.email, passcode: userData.passcode } satisfies LoginDto))?.accessToken;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(403);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionAdded,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const requestData = generateValidAnnouncements();
      const response = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(response.statusCode).toBe(401);
      const body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when try to use token from user that not exists', async () => {
      const userBob = generateValidUserWithPassword();

      const createBobResponse = await request(app.getServer()).post(userRoute.path).send(userBob).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createBobResponse.statusCode).toBe(201);
      const { data: bobDto, message: bobCreateMessage }: CreateUserResponseDto = createBobResponse.body;
      expect(bobDto?.id).toBeDefined();
      expect(bobCreateMessage).toBe(events.users.userCreated);

      const activateBobResponse = await request(app.getServer())
        .post(userRoute.path + '/' + bobDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateBobResponse.statusCode).toBe(200);

      const bobAccessToken = (await loginAs(app, { email: bobDto.email, passcode: userBob.passcode } satisfies LoginDto))?.accessToken;

      const deleteBobResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + bobDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteBobResponse.statusCode).toBe(200);

      const createAnnouncementsUsingBobAccessTokenResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${bobAccessToken}`);
      expect(createAnnouncementsUsingBobAccessTokenResponse.statusCode).toBe(401);
      expect(createAnnouncementsUsingBobAccessTokenResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsUsingBobAccessTokenResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as UnauthorizedException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Wrong_Authentication_Token);
      expect(loginArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
