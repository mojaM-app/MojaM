import { events, ILoginModel, SystemPermissions } from '@core';
import { errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { getAdminLoginData } from '@utils';
import request from 'supertest';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateAnnouncementsResponseDto } from '../dtos/create-announcements.dto';
import { GetAnnouncementListReqDto, GetAnnouncementListResponseDto } from '../dtos/get-announcement-list.dto';
import { AnnouncementsListRetrievedEvent } from '../events/announcements-list-retrieved-event';
import { AnnouncementsListRoute } from '../routes/announcements-list.routes';
import { AnnouncementsListService } from '../services/announcements-list.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { generateValidAnnouncements } from './test.helpers';

describe('GET/announcements-list', () => {
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

  describe('GET should respond with a status code of 200', () => {
    test('when data are valid and user has permission', async () => {
      const newAnnouncements = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(newAnnouncements, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      let body = createAnnouncementsResponse.body;
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(createMessage).toBe(events.announcements.announcementsCreated);
      expect(announcementsId).toBeDefined();

      const getAnnouncementsListResponse = await request(app!.getServer())
        .get(AnnouncementsListRoute.path)
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
      expect(new Date(announcements.validFromDate!).toDateString()).toBe(
        newAnnouncements.validFromDate!.toDateString(),
      );
      expect(announcements.itemsCount).toBeDefined();
      expect(announcements.itemsCount).toBe(newAnnouncements.items!.length);

      const deleteResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      expect(testEventHandlers.onAnnouncementsListRetrieved).toHaveBeenCalledWith(
        new AnnouncementsListRetrievedEvent(1),
      );
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const getAnnouncementsListResponse = await request(app!.getServer()).get(AnnouncementsListRoute.path).send();
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
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getAnnouncementsListResponse = await request(app!.getServer())
        .get(AnnouncementsListRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getAnnouncementsListResponse.statusCode).toBe(403);
      expect(getAnnouncementsListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
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
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(newUserDto.id, adminAccessToken, [
        SystemPermissions.PreviewAnnouncementsList,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getAnnouncementsListResponse = await request(app!.getServer())
        .get(AnnouncementsListRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getAnnouncementsListResponse.statusCode).toBe(403);
      expect(getAnnouncementsListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
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
      const getListResponse = await request(app!.getServer())
        .get(AnnouncementsListRoute.path)
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
      jest.spyOn(AnnouncementsListService.prototype, 'get').mockImplementation((_reqDto: GetAnnouncementListReqDto) => {
        throw new Error('Test error');
      });

      const getAnnouncementsListResponse = await request(app!.getServer())
        .get(AnnouncementsListRoute.path)
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
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
