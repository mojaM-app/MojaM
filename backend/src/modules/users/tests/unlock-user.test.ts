/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { AuthRoute, LoginDto, LoginResponseDto } from '@modules/auth';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import {
  ActivateUserResponseDto,
  CreateUserResponseDto,
  DeleteUserResponseDto,
  UnlockUserResponseDto,
  UserRoute,
  UserUnlockedEvent,
} from '@modules/users';
import { isNumber } from '@utils';
import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@utils/constants';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('POST /user/:id/unlock', () => {
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const authRoute = new AuthRoute();
  const app = new App();
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute, authRoute]);
    const { email, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('POST should respond with a status code of 200', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('when data are valid and user has permission', async () => {
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      // lock user
      const loginData: LoginDto = { email: newUserDto.email, phone: newUserDto.phone, password: user.password + 'invalid_password' };
      for (let index = 1; index <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        expect(typeof loginResponse?.body).toBe('object');
        const data = loginResponse.body.data;
        const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
        expect(loginArgs).toBeUndefined();
      }

      let loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, password: user.password } satisfies LoginDto);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = loginResponse.body.data as TranslatableHttpException;
      expect(typeof data).toBe('object');
      const { message: login1Message }: { message: string } = data;
      expect(login1Message).toBe(errorKeys.login.User_Is_Locked_Out);

      const unlockUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.unlockPath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(unlockUserResponse.statusCode).toBe(200);
      expect(unlockUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body: LoginResponseDto | UnlockUserResponseDto = unlockUserResponse.body as UnlockUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: result, message }: ActivateUserResponseDto = body;
      expect(message).toBe(events.users.userUnlocked);
      expect(result).toBe(true);

      loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, password: user.password } satisfies LoginDto);
      body = loginResponse.body as LoginResponseDto;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(user.email);
      expect(userLoggedIn.accessToken).toBeDefined();

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
              testEventHandlers.onUserLockedOut,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.lockedUserTriesToLogIn,
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
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS);
      expect(testEventHandlers.lockedUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUnlocked).toHaveBeenCalledWith(new UserUnlockedEvent(newUserDto, 1));
    });

    test('when data are valid, user has permission and unlockedUser is not locked', async () => {
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const unlockUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.unlockPath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(unlockUserResponse.statusCode).toBe(200);
      expect(unlockUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body: LoginResponseDto | UnlockUserResponseDto = unlockUserResponse.body as UnlockUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: result, message }: ActivateUserResponseDto = body;
      expect(message).toBe(events.users.userUnlocked);
      expect(result).toBe(true);

      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, password: user.password } satisfies LoginDto);
      body = loginResponse.body as LoginResponseDto;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(user.email);
      expect(userLoggedIn.accessToken).toBeDefined();

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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUnlocked).not.toHaveBeenCalled();
    });
  });

  describe('POST should respond with a status code of 403', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + userId + '/' + userRoute.unlockPath)
        .send();
      expect(activateUserResponse.statusCode).toBe(401);
      const body = activateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const requestData = generateValidUser();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
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

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const unlockUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.unlockPath)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(unlockUserResponse.statusCode).toBe(403);
      expect(unlockUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = unlockUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);
      expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserUuid }: DeleteUserResponseDto = body;
      expect(deletedUserUuid).toBe(user.id);

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

    test('when user have all permissions expect ActivateUser', async () => {
      const requestData = generateValidUser();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
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

      const systemPermissions = Object.values(SystemPermission);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermission.UnlockUser) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const unlockUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.unlockPath)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(unlockUserResponse.statusCode).toBe(403);
      expect(unlockUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = unlockUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);
      expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserUuid }: DeleteUserResponseDto = body;
      expect(deletedUserUuid).toBe(user.id);

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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const activateResponse = await request(app.getServer())
        .post(userRoute.path + '/' + userId + '/' + userRoute.unlockPath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(400);
      expect(activateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = activateResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: activateMessage, args: activateArgs } = data;
      expect(activateMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(activateArgs).toEqual({ id: userId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 404', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when user Id is not GUID', async () => {
      const activateResponse = await request(app.getServer())
        .post(userRoute.path + '/invalid-guid/' + userRoute.unlockPath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(404);
      expect(activateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { message: activateMessage }: { message: string } = body;
      expect(activateMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 401', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const activateResponse = await request(app.getServer())
        .post(userRoute.path + '/' + userId + '/' + userRoute.unlockPath)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(401);
      const body = activateResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

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
