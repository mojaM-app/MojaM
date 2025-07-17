import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { ILoginModel } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { userTestHelpers } from '@modules/users';
import { getAdminLoginData } from '@utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import Container from 'typedi';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { IUnlockAccountResultDto, UnlockAccountResponseDto } from '../dtos/unlock-account.dto';
import { AuthRoute } from '../routes/auth.routes';
import { AccountService } from '../services/account.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('POST /auth/unlock-account/', () => {
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

  describe('request should end with status code of 200', () => {
    it('when user with given id not exist', async () => {
      const response = await request(app!.getServer())
        .post(AuthRoute.unlockAccountPath + '/' + Guid.EMPTY)
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
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto } = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();

      // Activate the user
      const activateResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateResponse.statusCode).toBe(200);

      // Try to unlock the user who is not locked
      const response = await request(app!.getServer())
        .post(AuthRoute.unlockAccountPath + '/' + newUserDto.id)
        .send();
      expect(response.statusCode).toBe(200);

      // Verify response
      const body = response.body as UnlockAccountResponseDto;
      expect(typeof body).toBe('object');
      const { data: unlockResult }: { data: IUnlockAccountResultDto } = body;
      expect(unlockResult).toStrictEqual({
        success: true,
      } satisfies IUnlockAccountResultDto);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
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
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto } = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();

      // Activate the user
      const activateResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateResponse.statusCode).toBe(200);

      // Lock out the user by making multiple failed login attempts
      const loginData = { email: newUserDto.email, passcode: user.passcode + 'invalid_password' };
      for (let i = 1; i <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; i++) {
        const loginResponse = await app!.auth.login(loginData);
        expect(loginResponse.statusCode).toBe(400);
      }

      // Verify user is locked out
      const verifyLockedResponse = await app!.auth.login({
        email: newUserDto.email,
        passcode: user.passcode,
      } satisfies ILoginModel);
      expect(verifyLockedResponse.statusCode).toBe(400);
      expect(verifyLockedResponse.body.data.message).toBe(errorKeys.login.Account_Is_Locked_Out);

      // Now unlock the account
      const response = await request(app!.getServer())
        .post(AuthRoute.unlockAccountPath + '/' + newUserDto.id)
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
      const loginResponse = await app!.auth.login({
        email: newUserDto.email,
        passcode: user.passcode,
      } satisfies ILoginModel);
      expect(loginResponse.statusCode).toBe(200);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

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
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto } = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();

      // Activate the user
      const activateResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateResponse.statusCode).toBe(200);

      // Lock out the user by making multiple failed login attempts
      const loginData = { email: newUserDto.email, passcode: user.passcode + 'invalid_password' };
      for (let i = 1; i <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; i++) {
        const loginResponse = await app!.auth.login(loginData);
        expect(loginResponse.statusCode).toBe(400);
      }

      // Verify user is locked out
      const verifyLockedResponse = await app!.auth.login({
        email: newUserDto.email,
        passcode: user.passcode,
      } satisfies ILoginModel);
      expect(verifyLockedResponse.statusCode).toBe(400);
      expect(verifyLockedResponse.body.data.message).toBe(errorKeys.login.Account_Is_Locked_Out);

      // Unlock the account
      const unlockResponse = await request(app!.getServer())
        .post(AuthRoute.unlockAccountPath + '/' + newUserDto.id)
        .send();
      expect(unlockResponse.statusCode).toBe(200);

      // Verify successful login after unlock (this proves the failed login attempts counter was reset)
      const loginResponse = await app!.auth.login({
        email: newUserDto.email,
        passcode: user.passcode,
      } satisfies ILoginModel);
      expect(loginResponse.statusCode).toBe(200);

      // Verify we can attempt invalid login again without immediately locking out (which would happen if counter wasn't reset)
      const invalidLoginResponse = await app!.auth.login({
        email: newUserDto.email,
        passcode: user.passcode + 'invalid_password',
      } satisfies ILoginModel);
      expect(invalidLoginResponse.statusCode).toBe(400);
      expect(invalidLoginResponse.body.data.message).toBe(errorKeys.login.Invalid_Login_Or_Passcode);

      // We should still be able to log in successfully (proving counter was reset to 0, not just decremented)
      const secondLoginResponse = await app!.auth.login({
        email: newUserDto.email,
        passcode: user.passcode,
      } satisfies ILoginModel);
      expect(secondLoginResponse.statusCode).toBe(200);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

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
        .post(AuthRoute.unlockAccountPath + '/invalidUserId')
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

  describe('GET should handle errors', () => {
    it('when service throws an error', async () => {
      const accountService = Container.get(AccountService);
      const mockGet = jest.spyOn(accountService, 'unlockAccount').mockRejectedValue(new Error('Service error'));
      const response = await request(app!.getServer())
        .post(AuthRoute.unlockAccountPath + '/' + Guid.EMPTY)
        .send();
      expect(response.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
