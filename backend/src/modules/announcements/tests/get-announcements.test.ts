import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { getAdminLoginData, isGuid } from '@utils';
import { isDateString } from 'class-validator';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { generateValidAnnouncements } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateAnnouncementsResponseDto } from '../dtos/create-announcements.dto';
import { GetAnnouncementsResponseDto } from '../dtos/get-announcements.dto';
import { AnnouncementStateValue } from '../enums/announcement-state.enum';
import { AnnouncementsRout } from '../routes/announcements.routes';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('GET /announcements', () => {
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

  describe('GET should respond with a status code of 200 when data are valid and user has permission', () => {
    test('get unpublished announcement', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app!.getServer())
        .post(AnnouncementsRout.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const getAnnouncementsResponse = await request(app!.getServer())
        .get(AnnouncementsRout.path + '/' + announcementsId)
        .send()
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
      expect(new Date(announcements.validFromDate!).toDateString()).toBe(requestData.validFromDate!.toDateString());
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
      const deleteAnnouncementsResponse = await request(app!.getServer())
        .delete(AnnouncementsRout.path + '/' + announcementsId)
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

    test('get published announcement', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app!.getServer())
        .post(AnnouncementsRout.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const publishAnnouncementsResponse = await request(app!.getServer())
        .post(AnnouncementsRout.path + '/' + announcementsId + '/' + AnnouncementsRout.publishPath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);

      const getAnnouncementsResponse = await request(app!.getServer())
        .get(AnnouncementsRout.path + '/' + announcementsId)
        .send()
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
      expect(new Date(announcements.createdAt).getTime() - new Date(announcements.updatedAt).getTime()).toBeLessThan(2);
      expect(announcements.title).toBe(requestData.title);
      expect(announcements.state).toBe(AnnouncementStateValue.PUBLISHED);
      expect(announcements.publishedAt).toBeDefined();
      expect(announcements.publishedBy).toBeDefined();
      expect(new Date(announcements.validFromDate!).toDateString()).toBe(requestData.validFromDate!.toDateString());
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
      const deleteAnnouncementsResponse = await request(app!.getServer())
        .delete(AnnouncementsRout.path + '/' + announcementsId)
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
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should respond with a status code of 400', () => {
    test('GET should respond with a status code of 400 when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const getAnnouncementsResponse = await request(app!.getServer())
        .get(AnnouncementsRout.path + '/' + userId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(400);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: getMessage, args: getArgs } = data;
      expect(getMessage).toBe(errorKeys.announcements.Announcements_Does_Not_Exist);
      expect(getArgs).toEqual({ id: userId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should respond with a status code of 404', () => {
    test('GET should respond with a status code of 404 when user Id is not GUID', async () => {
      const getAnnouncementsResponse = await request(app!.getServer())
        .get(AnnouncementsRout.path + '/invalid-guid')
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(404);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { message: deleteMessage }: { message: string } = body;
      expect(deleteMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const id: string = Guid.EMPTY;
      const getAnnouncementsResponse = await request(app!.getServer())
        .get(AnnouncementsRout.path + '/' + id)
        .send();
      expect(getAnnouncementsResponse.statusCode).toBe(401);
      const body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const userData = userTestHelpers.generateValidUserWithPassword();
      const newUserResponse = await app!.user.create(userData, adminAccessToken);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: userData.email, passcode: userData.passcode } satisfies ILoginModel)
      )?.accessToken;

      const id: string = Guid.EMPTY;
      const getAnnouncementsResponse = await request(app!.getServer())
        .get(AnnouncementsRout.path + '/' + id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(403);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
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

    test('when user have all permissions expect GetAnnouncements (PreviewAnnouncementsList, EditAnnouncements)', async () => {
      const userData = userTestHelpers.generateValidUserWithPassword();
      const newUserResponse = await app!.user.create(userData, adminAccessToken);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(user.id, adminAccessToken, [
        SystemPermissions.PreviewAnnouncementsList,
        SystemPermissions.EditAnnouncements,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: userData.email, passcode: userData.passcode } satisfies ILoginModel)
      )?.accessToken;

      const id: string = Guid.EMPTY;
      const getAnnouncementsResponse = await request(app!.getServer())
        .get(AnnouncementsRout.path + '/' + id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(403);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
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

  describe('GET should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const id: string = Guid.EMPTY;
      const response = await request(app!.getServer())
        .get(AnnouncementsRout.path + '/' + id)
        .send()
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
      const userBob = userTestHelpers.generateValidUserWithPassword();
      const createBobResponse = await app!.user.create(userBob, adminAccessToken);
      expect(createBobResponse.statusCode).toBe(201);
      const { data: bobDto, message: bobCreateMessage }: CreateUserResponseDto = createBobResponse.body;
      expect(bobDto?.id).toBeDefined();
      expect(bobCreateMessage).toBe(events.users.userCreated);

      const activateBobResponse = await app!.user.activate(bobDto.id, adminAccessToken);
      expect(activateBobResponse.statusCode).toBe(200);

      const bobAccessToken = (
        await app!.auth.loginAs({ email: bobDto.email, passcode: userBob.passcode } satisfies ILoginModel)
      )?.accessToken;

      const deleteBobResponse = await app!.user.delete(bobDto.id, adminAccessToken);
      expect(deleteBobResponse.statusCode).toBe(200);

      const id: string = Guid.EMPTY;
      const getAnnouncementsUsingBobAccessTokenResponse = await request(app!.getServer())
        .get(AnnouncementsRout.path + '/' + id)
        .send()
        .set('Authorization', `Bearer ${bobAccessToken}`);
      expect(getAnnouncementsUsingBobAccessTokenResponse.statusCode).toBe(401);
      expect(getAnnouncementsUsingBobAccessTokenResponse.headers['content-type']).toEqual(
        expect.stringContaining('json'),
      );
      const body = getAnnouncementsUsingBobAccessTokenResponse.body;
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
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
