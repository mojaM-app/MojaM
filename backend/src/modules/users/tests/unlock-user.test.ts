/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUserWithPassword, loginAs } from '@helpers/user-tests.helpers';
import { AuthRoute, LoginDto, LoginResponseDto } from '@modules/auth';
import { PermissionsRoute, SystemPermissions } from '@modules/permissions';
import { ActivateUserResponseDto, CreateUserResponseDto, UnlockUserResponseDto, UserRoute } from '@modules/users';
import { isNumber } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { App } from './../../../app';

describe('POST /user/:id/unlock', () => {
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const authRoute = new AuthRoute();
  const app = new App();
  let adminAccessToken: string | undefined;
  let mockSendMail: any;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute, authRoute]);
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

  describe('POST should respond with a status code of 200', () => {
    it('when data are valid and user has permission', async () => {
      const user = generateValidUserWithPassword();
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
      const loginData: LoginDto = { email: newUserDto.email, phone: newUserDto.phone, passcode: user.passcode + 'invalid_passcode' };
      for (let index = 1; index < USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        expect(typeof loginResponse?.body).toBe('object');
        const data = loginResponse.body.data;
        const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
        expect(loginArgs).toBeUndefined();
      }

      let loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, passcode: user.passcode + 'invalid_passcode' } satisfies LoginDto);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = loginResponse.body.data as BadRequestException;
      expect(typeof data).toBe('object');
      const { message: login1Message }: { message: string } = data;
      expect(login1Message).toBe(errorKeys.login.Account_Is_Locked_Out);

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
        .send({ email: newUserDto.email, passcode: user.passcode } satisfies LoginDto);
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
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when data are valid, user has permission and unlockedUser is not locked', async () => {
      const user = generateValidUserWithPassword();
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
        .send({ email: newUserDto.email, passcode: user.passcode } satisfies LoginDto);
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
      const requestData = generateValidUserWithPassword();

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

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

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
      const requestData = generateValidUserWithPassword();

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

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.UnlockUser) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

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
      const activateResponse = await request(app.getServer())
        .post(userRoute.path + '/' + userId + '/' + userRoute.unlockPath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(400);
      expect(activateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = activateResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
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
