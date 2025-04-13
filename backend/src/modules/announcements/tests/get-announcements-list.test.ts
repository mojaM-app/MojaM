/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUserWithPassword, loginAs } from '@helpers/user-tests.helpers';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermissions } from '@modules/permissions';
import { CreateUserResponseDto, UserRoute } from '@modules/users';
import { isNumber } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { CreateAnnouncementsResponseDto } from '../dtos/create-announcements.dto';
import { GetAnnouncementListReqDto, GetAnnouncementListResponseDto } from '../dtos/get-announcement-list.dto';
import { AnnouncementsListRetrievedEvent } from '../events/announcements-list-retrieved-event';
import { AnnouncementsListRoute } from '../routes/announcements-list.routes';
import { AnnouncementsRout } from '../routes/announcements.routes';
import { AnnouncementsListService } from '../services/announcements-list.service';
import { App } from './../../../app';
import { generateValidAnnouncements } from './announcements-tests.helpers';

describe('GET/announcements-list', () => {
  const announcementRoute = new AnnouncementsRout();
  const userRoute = new UserRoute();
  const announcementsListRoute = new AnnouncementsListRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let mockSendMail: any;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRoute, announcementsListRoute, announcementRoute, permissionsRoute]);
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

  describe('GET should respond with a status code of 200', () => {
    test('when data are valid and user has permission', async () => {
      const newAnnouncements = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(newAnnouncements)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      let body = createAnnouncementsResponse.body;
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(createMessage).toBe(events.announcements.announcementsCreated);
      expect(announcementsId).toBeDefined();

      const getAnnouncementsListResponse = await request(app.getServer())
        .get(announcementsListRoute.path)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsListResponse.statusCode).toBe(200);
      expect(getAnnouncementsListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsListResponse.body;
      expect(typeof body).toBe('object');
      const { data: gridPage, message: getUserListMessage }: GetAnnouncementListResponseDto = body;
      expect(getUserListMessage).toBe(events.announcements.announcementsListRetrieved);
      expect(gridPage).toBeDefined();
      expect(typeof gridPage).toBe('object');
      expect(gridPage.totalCount).toBeDefined();
      expect(typeof gridPage.totalCount).toBe('number');
      expect(gridPage.totalCount).toBeGreaterThan(0);
      expect(gridPage.items).toBeDefined();
      expect(Array.isArray(gridPage.items)).toBe(true);
      expect(gridPage.items.length).toBeGreaterThan(0);

      const announcements = gridPage.items[0];
      expect(new Date(announcements.validFromDate!).toISOString().slice(0, 10)).toBe(newAnnouncements.validFromDate!.toISOString().slice(0, 10));
      expect(announcements.itemsCount).toBeDefined();
      expect(announcements.itemsCount).toBe(newAnnouncements.items!.length);

      const deleteResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsListRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsListRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsListRetrieved).toHaveBeenCalledWith(new AnnouncementsListRetrievedEvent(1));
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const getAnnouncementsListResponse = await request(app.getServer()).get(announcementsListRoute.path).send();
      expect(getAnnouncementsListResponse.statusCode).toBe(401);
      const body = getAnnouncementsListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const requestData = generateValidUserWithPassword();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      const getAnnouncementsListResponse = await request(app.getServer())
        .get(announcementsListRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getAnnouncementsListResponse.statusCode).toBe(403);
      expect(getAnnouncementsListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
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
      expect(testEventHandlers.onAnnouncementsListRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when user have all permissions expect PreviewAnnouncementsList', async () => {
      const requestData = generateValidUserWithPassword();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.PreviewAnnouncementsList) {
            const path = permissionsRoute.path + '/' + newUserDto.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      const getAnnouncementsListResponse = await request(app.getServer())
        .get(announcementsListRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getAnnouncementsListResponse.statusCode).toBe(403);
      expect(getAnnouncementsListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
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
      expect(testEventHandlers.onAnnouncementsListRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('GET should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const getListResponse = await request(app.getServer())
        .get(announcementsListRoute.path)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(getListResponse.statusCode).toBe(401);
      const body = getListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should handle error', () => {
    test('when error occurs in the process', async () => {
      jest.spyOn(AnnouncementsListService.prototype, 'get').mockImplementation((reqDto: GetAnnouncementListReqDto) => {
        throw new Error('Test error');
      });

      const getAnnouncementsListResponse = await request(app.getServer())
        .get(announcementsListRoute.path)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
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
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
