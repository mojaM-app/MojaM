import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { ILoginModel, RouteConstants } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { generateRandomDate, getAdminLoginData } from '@utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import Container from 'typedi';
import { GetAccountToActivateResponseDto, IAccountToActivateResultDto } from '../dtos/get-account-to-activate.dto';
import { AuthRoute } from '../routes/auth.routes';
import { AccountService } from '../services/account.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { TestApp } from './../../../helpers/tests.utils';

describe('POST /auth/get-account-to-activate/:userId/', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await testHelpers.loginAs(app, { email, passcode } satisfies ILoginModel))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('request should end with status code of 200', () => {
    it('when user with given id not exist', async () => {
      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountToActivatePath + '/' + Guid.EMPTY)
        .send();
      expect(response.statusCode).toBe(200);
      const body = response.body as GetAccountToActivateResponseDto;
      expect(typeof body).toBe('object');
      const { data: toActivateResult } = body;
      expect(toActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IAccountToActivateResultDto);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user with given id is active', async () => {
      const { uuid } = getAdminLoginData();
      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountToActivatePath + '/' + uuid)
        .send();
      expect(response.statusCode).toBe(200);
      const body = response.body as GetAccountToActivateResponseDto;
      expect(typeof body).toBe('object');
      const { data: toActivateResult } = body;
      expect(toActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IAccountToActivateResultDto);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user with given id is active and is lockedOut', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();

      const activateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, passcode: user.passcode + 'invalid_passcode' };

      for (let index = 1; index < USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        const body = loginResponse.body;
        expect(typeof body).toBe('object');
        const data = body.data as BadRequestException;
        const { message: loginMessage, args: loginArgs } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
        expect(loginArgs).toBeUndefined();
      }
      const loginResponse = await request(app!.getServer())
        .post(AuthRoute.loginPath)
        .send({ email: newUserDto.email, passcode: user.passcode + 'invalid_passcode' } satisfies ILoginModel);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = loginResponse.body.data as BadRequestException;
      expect(typeof data).toBe('object');
      const { message: login1Message }: { message: string } = data;
      expect(login1Message).toBe(errorKeys.login.Account_Is_Locked_Out);

      const toActivateResponse = await request(app!.getServer())
        .post(AuthRoute.getAccountToActivatePath + '/' + newUserDto.id)
        .send();
      expect(toActivateResponse.statusCode).toBe(200);
      const body = toActivateResponse.body as GetAccountToActivateResponseDto;
      expect(typeof body).toBe('object');
      const { data: toActivateResult } = body;
      expect(toActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IAccountToActivateResultDto);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
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
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('when user with given id is inactive and is lockedOut', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();

      const activateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, passcode: user.passcode + 'invalid_passcode' };

      for (let index = 1; index < USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        const body = loginResponse.body;
        expect(typeof body).toBe('object');
        const data = body.data as BadRequestException;
        const { message: loginMessage, args: loginArgs } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
        expect(loginArgs).toBeUndefined();
      }
      const loginResponse = await request(app!.getServer())
        .post(AuthRoute.loginPath)
        .send({ email: newUserDto.email, passcode: user.passcode + 'invalid_passcode' } satisfies ILoginModel);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = loginResponse.body.data as BadRequestException;
      expect(typeof data).toBe('object');
      const { message: login1Message }: { message: string } = data;
      expect(login1Message).toBe(errorKeys.login.Account_Is_Locked_Out);

      const deactivateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_DEACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateUserResponse.statusCode).toBe(200);

      const toActivateResponse = await request(app!.getServer())
        .post(AuthRoute.getAccountToActivatePath + '/' + newUserDto.id)
        .send();
      expect(toActivateResponse.statusCode).toBe(200);
      const body = toActivateResponse.body as GetAccountToActivateResponseDto;
      expect(typeof body).toBe('object');
      const { data: toActivateResult } = body;
      expect(toActivateResult).toStrictEqual({
        isActive: false,
        isLockedOut: true,
      } satisfies IAccountToActivateResultDto);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
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
              testEventHandlers.onUserDeactivated,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('when user with given id is inactive', async () => {
      const user = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();

      const toActivateResponse = await request(app!.getServer())
        .post(AuthRoute.getAccountToActivatePath + '/' + newUserDto.id)
        .send();
      expect(toActivateResponse.statusCode).toBe(200);
      const body = toActivateResponse.body as GetAccountToActivateResponseDto;
      expect(typeof body).toBe('object');
      const { data: toActivateResult } = body;
      toActivateResult.joiningDate = new Date(toActivateResult.joiningDate!);
      expect(toActivateResult).toStrictEqual({
        email: user.email,
        phone: user.phone,
        joiningDate: user.joiningDate,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: false,
        isLockedOut: false,
      } satisfies IAccountToActivateResultDto);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
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
              testEventHandlers.onUserDeactivated,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });
  });

  describe('request should end with status code of 404', () => {
    it('when user id is invalid', async () => {
      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountToActivatePath + '/invalidUserId')
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
      const mockGet = jest.spyOn(accountService, 'getAccountToActivate').mockRejectedValue(new Error('Service error'));
      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountToActivatePath + '/' + Guid.EMPTY)
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
