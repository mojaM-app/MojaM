import { BadRequestException, errorKeys } from '@exceptions';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { AuthRoute, IUnlockAccountResultDto, LoginDto, UnlockAccountResponseDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { UserRoute } from '@modules/users';
import { getAdminLoginData } from '@utils';
import { testUtils } from '@helpers';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { TestApp } from './../../../helpers/tests.utils';

describe('POST /auth/unlock-account/', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testUtils.getTestApp([userRoute, permissionsRoute]);
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await testUtils.loginAs(app, { email, passcode } satisfies LoginDto))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('request should end with status code of 200', () => {
    it('when user with given id not exist', async () => {
      const response = await request(app!.getServer())
        .post(authRoute.unlockAccountPath + '/' + Guid.EMPTY)
        .send();
      expect(response.statusCode).toBe(200);
      const body = response.body as UnlockAccountResponseDto;
      expect(typeof body).toBe('object');
      const { data: unlockResult }: { data: IUnlockAccountResultDto } = body;
      expect(unlockResult).toStrictEqual({
        success: true,
      } satisfies IUnlockAccountResultDto);
      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user with given id exist and is not locked out', async () => {
      // Create a user
      const user = testUtils.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto } = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();

      // Activate the user
      const activateResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(200);

      // Try to unlock the user who is not locked
      const response = await request(app!.getServer())
        .post(authRoute.unlockAccountPath + '/' + newUserDto.id)
        .send();
      expect(response.statusCode).toBe(200);

      // Verify response
      const body = response.body as UnlockAccountResponseDto;
      expect(typeof body).toBe('object');
      const { data: unlockResult }: { data: IUnlockAccountResultDto } = body;
      expect(unlockResult).toStrictEqual({
        success: true,
      } satisfies IUnlockAccountResultDto);

      // Clean up
      const deleteResponse = await request(app!.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('when user with given id exist and is locked out', async () => {
      // Create a user
      const user = testUtils.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto } = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();

      // Activate the user
      const activateResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(200);

      // Lock out the user by making multiple failed login attempts
      const loginData = { email: newUserDto.email, passcode: user.passcode + 'invalid_password' };
      for (let i = 1; i <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; i++) {
        const loginResponse = await request(app!.getServer()).post(authRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
      }

      // Verify user is locked out
      const verifyLockedResponse = await request(app!.getServer())
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, passcode: user.passcode });
      expect(verifyLockedResponse.statusCode).toBe(400);
      expect(verifyLockedResponse.body.data.message).toBe(errorKeys.login.Account_Is_Locked_Out);

      // Now unlock the account
      const response = await request(app!.getServer())
        .post(authRoute.unlockAccountPath + '/' + newUserDto.id)
        .send();
      expect(response.statusCode).toBe(200);

      // Verify response
      const body = response.body as UnlockAccountResponseDto;
      expect(typeof body).toBe('object');
      const { data: unlockResult }: { data: IUnlockAccountResultDto } = body;
      expect(unlockResult).toStrictEqual({
        success: true,
      } satisfies IUnlockAccountResultDto);

      // Verify user can now log in
      const loginResponse = await request(app!.getServer()).post(authRoute.loginPath).send({ email: newUserDto.email, passcode: user.passcode });
      expect(loginResponse.statusCode).toBe(200);

      // Clean up
      const deleteResponse = await request(app!.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserLockedOut,
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
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalled();
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.lockedUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUnlocked).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('when user in unlocked, failed login attempts is reset', async () => {
      // Create a user
      const user = testUtils.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto } = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();

      // Activate the user
      const activateResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(200);

      // Lock out the user by making multiple failed login attempts
      const loginData = { email: newUserDto.email, passcode: user.passcode + 'invalid_password' };
      for (let i = 1; i <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; i++) {
        const loginResponse = await request(app!.getServer()).post(authRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
      }

      // Verify user is locked out
      const verifyLockedResponse = await request(app!.getServer())
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, passcode: user.passcode });
      expect(verifyLockedResponse.statusCode).toBe(400);
      expect(verifyLockedResponse.body.data.message).toBe(errorKeys.login.Account_Is_Locked_Out);

      // Unlock the account
      const unlockResponse = await request(app!.getServer())
        .post(authRoute.unlockAccountPath + '/' + newUserDto.id)
        .send();
      expect(unlockResponse.statusCode).toBe(200);

      // Verify successful login after unlock (this proves the failed login attempts counter was reset)
      const loginResponse = await request(app!.getServer()).post(authRoute.loginPath).send({ email: newUserDto.email, passcode: user.passcode });
      expect(loginResponse.statusCode).toBe(200);

      // Verify we can attempt invalid login again without immediately locking out (which would happen if counter wasn't reset)
      const invalidLoginResponse = await request(app!.getServer())
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, passcode: user.passcode + 'invalid_password' });
      expect(invalidLoginResponse.statusCode).toBe(400);
      expect(invalidLoginResponse.body.data.message).toBe(errorKeys.login.Invalid_Login_Or_Passcode);

      // We should still be able to log in successfully (proving counter was reset to 0, not just decremented)
      const secondLoginResponse = await request(app!.getServer())
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, passcode: user.passcode });
      expect(secondLoginResponse.statusCode).toBe(200);

      // Clean up
      const deleteResponse = await request(app!.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // Verify events
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserLockedOut,
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
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalled();
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.lockedUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUnlocked).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(2); // Logged in twice
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('request should end with status code of 404', () => {
    it('when user id is invalid', async () => {
      const response = await request(app!.getServer())
        .post(authRoute.unlockAccountPath + '/invalidUserId')
        .send();
      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as BadRequestException;
      expect(typeof body).toBe('object');
      const { message: activateMessage }: { message: string } = body;
      expect(activateMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  afterAll(async () => {
    await testUtils.closeTestApp();
    jest.resetAllMocks();
  });
});
