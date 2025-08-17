import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { LoginResponseDto } from '@modules/auth';
import { userTestHelpers } from '@modules/users';
import { getAdminLoginData } from '@utils';
import { Guid } from 'guid-typescript';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { ActivateUserResponseDto } from '../dtos/activate-user.dto';
import { CreateUserResponseDto } from '../dtos/create-user.dto';
import { UnlockUserResponseDto } from '../dtos/unlock-user.dto';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('POST /user/:id/unlock', () => {
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
    it('when data are valid and user has permission', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateUserResponse.statusCode).toBe(200);

      // lock user
      const loginData: ILoginModel = {
        email: newUserDto.email,
        phone: newUserDto.phone,
        passcode: user.passcode + 'invalid_passcode',
      };
      for (let index = 1; index < USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await app!.auth.login(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        expect(typeof loginResponse?.body).toBe('object');
        const data = loginResponse.body.data;
        const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
        expect(loginArgs).toBeUndefined();
      }

      let loginResponse = await app!.auth.login({
        email: newUserDto.email,
        passcode: user.passcode + 'invalid_passcode',
      } satisfies ILoginModel);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = loginResponse.body.data as BadRequestException;
      expect(typeof data).toBe('object');
      const { message: login1Message }: { message: string } = data;
      expect(login1Message).toBe(errorKeys.login.Account_Is_Locked_Out);

      const unlockUserResponse = await app!.user.unlock(newUserDto.id, adminAccessToken);
      expect(unlockUserResponse.statusCode).toBe(200);
      expect(unlockUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body: LoginResponseDto | UnlockUserResponseDto = unlockUserResponse.body as UnlockUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: result, message }: ActivateUserResponseDto = body;
      expect(message).toBe(events.users.userUnlocked);
      expect(result).toBe(true);

      loginResponse = await app!.auth.login({ email: newUserDto.email, passcode: user.passcode } satisfies ILoginModel);
      body = loginResponse.body as LoginResponseDto;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(user.email);
      expect(userLoggedIn.accessToken).toBeDefined();

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLockedOut,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserUnlocked,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(
        USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS,
      );
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when data are valid, user has permission and unlockedUser is not locked', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateUserResponse.statusCode).toBe(200);

      const unlockUserResponse = await app!.user.unlock(newUserDto.id, adminAccessToken);
      expect(unlockUserResponse.statusCode).toBe(200);
      expect(unlockUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body: LoginResponseDto | UnlockUserResponseDto = unlockUserResponse.body as UnlockUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: result, message }: ActivateUserResponseDto = body;
      expect(message).toBe(events.users.userUnlocked);
      expect(result).toBe(true);

      const loginResponse = await app!.auth.login({
        email: newUserDto.email,
        passcode: user.passcode,
      } satisfies ILoginModel);
      body = loginResponse.body as LoginResponseDto;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(user.email);
      expect(userLoggedIn.accessToken).toBeDefined();

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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUnlocked).not.toHaveBeenCalled();
    });
  });

  describe('POST should respond with a status code of 403', () => {
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

      const unlockUserResponse = await app!.user.unlock(user.id, newUserAccessToken);
      expect(unlockUserResponse.statusCode).toBe(403);
      expect(unlockUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = unlockUserResponse.body;
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

    test('when user have all permissions expect UnlockUser', async () => {
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
        SystemPermissions.UnlockUser,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const unlockUserResponse = await app!.user.unlock(user.id, newUserAccessToken);
      expect(unlockUserResponse.statusCode).toBe(403);
      expect(unlockUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = unlockUserResponse.body;
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
      const unlockResponse = await app!.user.unlock(userId, adminAccessToken);
      expect(unlockResponse.statusCode).toBe(400);
      expect(unlockResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = unlockResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: unlockMessage, args: unlockArgs } = data;
      expect(unlockMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(unlockArgs).toEqual({ id: userId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 404', () => {
    test('when user Id is not GUID', async () => {
      const unlockResponse = await app!.user.unlock('invalid-guid', adminAccessToken);
      expect(unlockResponse.statusCode).toBe(404);
      expect(unlockResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = unlockResponse.body;
      expect(typeof body).toBe('object');
      const { message: unlockMessage }: { message: string } = body;
      expect(unlockMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const unlockUserResponse = await app!.user.unlock(userId);
      expect(unlockUserResponse.statusCode).toBe(401);
      const body = unlockUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const unlockResponse = await app!.user.unlock(userId, `invalid_token_${adminAccessToken}`);
      expect(unlockResponse.statusCode).toBe(401);
      const body = unlockResponse.body;
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
