import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { getAdminLoginData, isGuid } from '@utils';
import { isDateString } from 'class-validator';
import { Guid } from 'guid-typescript';
import { generateValidAnnouncements } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateAnnouncementsResponseDto } from '../dtos/create-announcements.dto';
import { GetAnnouncementsResponseDto } from '../dtos/get-announcements.dto';
import { PublishAnnouncementsResponseDto } from '../dtos/publish-announcements.dto';
import { AnnouncementStateValue } from '../enums/announcement-state.enum';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('POST /announcements/publish', () => {
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

  describe('POST should respond with a status code of 200 when data are valid and user has permission', () => {
    test('create and publish announcement', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      const publishAnnouncementsResponse = await app!.announcements.publish(announcementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);
      body = publishAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: publishAnnouncementsResult, message: publishMessage }: PublishAnnouncementsResponseDto = body;
      expect(publishAnnouncementsResult).toBe(true);
      expect(publishMessage).toBe(events.announcements.announcementsPublished);

      const getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      expect(announcements.title).toBe(requestData.title);
      expect(announcements.state).toBe(AnnouncementStateValue.PUBLISHED);
      expect(announcements.publishedAt).toBeDefined();
      expect(announcements.publishedBy).toBeDefined();
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

    test('publish published announcement', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let publishAnnouncementsResponse = await app!.announcements.publish(announcementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);
      body = publishAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: publish1AnnouncementsResult, message: publish1Message }: PublishAnnouncementsResponseDto = body;
      expect(publish1AnnouncementsResult).toBe(true);
      expect(publish1Message).toBe(events.announcements.announcementsPublished);

      publishAnnouncementsResponse = await app!.announcements.publish(announcementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);
      body = publishAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: publish2AnnouncementsResult, message: publish2Message }: PublishAnnouncementsResponseDto = body;
      expect(publish2AnnouncementsResult).toBe(true);
      expect(publish2Message).toBe(events.announcements.announcementsPublished);

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
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 400', () => {
    test('when validFromDate is undefined', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = undefined;
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      const publishAnnouncementsResponse = await app!.announcements.publish(announcementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(400);
      const data = publishAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(
        errors.filter(x => x !== errorKeys.announcements.Announcements_Without_ValidFromDate_Can_Not_Be_Published)
          .length,
      ).toBe(0);

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
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('when validFromDate is null', async () => {
      const requestData = generateValidAnnouncements();
      requestData.validFromDate = null;
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      const publishAnnouncementsResponse = await app!.announcements.publish(announcementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(400);
      const data = publishAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(
        errors.filter(x => x !== errorKeys.announcements.Announcements_Without_ValidFromDate_Can_Not_Be_Published)
          .length,
      ).toBe(0);

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
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('when try to publish announcements that not exists', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      const publishAnnouncementsResponse = await app!.announcements.publish(announcementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(400);
      const data = publishAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Announcements_Does_Not_Exist).length).toBe(0);

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
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const id: string = Guid.EMPTY;
      const publishAnnouncementsResponse = await app!.announcements.publish(id);
      expect(publishAnnouncementsResponse.statusCode).toBe(401);
      const body = publishAnnouncementsResponse.body;
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

      const publishAnnouncementsResponse = await app!.announcements.publish(user.id, newUserAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(403);
      expect(publishAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = publishAnnouncementsResponse.body;
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

    test('when user have all permissions expect PublishAnnouncements', async () => {
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

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(user.id, adminAccessToken, [
        SystemPermissions.PublishAnnouncements,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: userData.email, passcode: userData.passcode } satisfies ILoginModel)
      )?.accessToken;

      const publishAnnouncementsResponse = await app!.announcements.publish(user.id, newUserAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(403);
      expect(publishAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = publishAnnouncementsResponse.body;
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

  describe('POST should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const id: string = Guid.EMPTY;
      const response = await app!.announcements.publish(id, `invalid_token_${adminAccessToken}`);
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

      const createAnnouncementsResponse = await app!.announcements.create(
        generateValidAnnouncements(),
        adminAccessToken,
      );
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      const publishAnnouncementsUsingBobAccessTokenResponse = await app!.announcements.publish(
        announcementsId,
        bobAccessToken,
      );
      expect(publishAnnouncementsUsingBobAccessTokenResponse.statusCode).toBe(401);
      expect(publishAnnouncementsUsingBobAccessTokenResponse.headers['content-type']).toEqual(
        expect.stringContaining('json'),
      );
      body = publishAnnouncementsUsingBobAccessTokenResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as UnauthorizedException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Wrong_Authentication_Token);
      expect(loginArgs).toBeUndefined();

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
