import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { userTestHelpers } from '@modules/users';
import { getAdminLoginData } from '@utils';
import { Guid } from 'guid-typescript';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateUserResponseDto } from '../dtos/create-user.dto';
import { DeactivateUserResponseDto } from '../dtos/deactivate-user.dto';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('POST /user/:id/deactivate', () => {
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

  describe('POST should respond with a status code of 200', () => {
    test('when data are valid and user has permission', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateUserResponse = await app!.user.deactivate(newUserDto.id, adminAccessToken);
      expect(deactivateUserResponse.statusCode).toBe(200);
      expect(deactivateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deactivateUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: result, message }: DeactivateUserResponseDto = body;
      expect(message).toBe(events.users.userDeactivated);
      expect(result).toBe(true);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeactivated,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when data are valid, user has permission and deactivatedUser is not active', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateUserResponse1 = await app!.user.deactivate(newUserDto.id, adminAccessToken);
      expect(deactivateUserResponse1.statusCode).toBe(200);
      expect(deactivateUserResponse1.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = deactivateUserResponse1.body;
      expect(typeof body).toBe('object');
      const { data: result1, message: message1 }: DeactivateUserResponseDto = body;
      expect(message1).toBe(events.users.userDeactivated);
      expect(result1).toBe(true);

      const deactivateUserResponse2 = await app!.user.deactivate(newUserDto.id, adminAccessToken);
      expect(deactivateUserResponse2.statusCode).toBe(200);
      expect(deactivateUserResponse2.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deactivateUserResponse2.body;
      expect(typeof body).toBe('object');
      const { data: result2, message: message2 }: DeactivateUserResponseDto = body;
      expect(message2).toBe(events.users.userDeactivated);
      expect(result2).toBe(true);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeactivated,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when data are valid, user has permission and deactivatedUser is active', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateUserResponse.statusCode).toBe(200);

      const deactivateUserResponse = await app!.user.deactivate(newUserDto.id, adminAccessToken);
      expect(deactivateUserResponse.statusCode).toBe(200);
      expect(deactivateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deactivateUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: result2, message: message2 }: DeactivateUserResponseDto = body;
      expect(message2).toBe(events.users.userDeactivated);
      expect(result2).toBe(true);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeactivated,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const deactivateUserResponse = await app!.user.deactivate(userId);
      expect(deactivateUserResponse.statusCode).toBe(401);
      const body = deactivateUserResponse.body;
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
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;
      const deactivateUserResponse = await app!.user.deactivate(user.id, newUserAccessToken);
      expect(deactivateUserResponse.statusCode).toBe(403);
      expect(deactivateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deactivateUserResponse.body;
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

    test('when user have all permissions expect DeactivateUser', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(user.id, adminAccessToken, [
        SystemPermissions.DeactivateUser,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const deactivateUserResponse = await app!.user.deactivate(user.id, newUserAccessToken);
      expect(deactivateUserResponse.statusCode).toBe(403);
      expect(deactivateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deactivateUserResponse.body;
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

  describe('POST should respond with a status code of 400', () => {
    test('when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const deactivateResponse = await app!.user.deactivate(userId, adminAccessToken);
      expect(deactivateResponse.statusCode).toBe(400);
      expect(deactivateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deactivateResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: deactivateMessage, args: deactivateArgs } = data;
      expect(deactivateMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(deactivateArgs).toEqual({ id: userId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 404', () => {
    test('when user Id is not GUID', async () => {
      const deactivateResponse = await app!.user.deactivate('invalid-guid', adminAccessToken);
      expect(deactivateResponse.statusCode).toBe(404);
      expect(deactivateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deactivateResponse.body;
      expect(typeof body).toBe('object');
      const { message: deactivateMessage }: { message: string } = body;
      expect(deactivateMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const deactivateResponse = await app!.user.deactivate(userId, `invalid_token_${adminAccessToken}`);
      expect(deactivateResponse.statusCode).toBe(401);
      const body = deactivateResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

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
