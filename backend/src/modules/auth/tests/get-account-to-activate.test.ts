import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { BadRequestException, errorKeys } from '@exceptions';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { AuthRoute, GetAccountToActivateResponseDto, IAccountToActivateResultDto, LoginDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserDto, CreateUserResponseDto, UserRoute } from '@modules/users';
import { generateRandomDate, getAdminLoginData } from '@utils';
import { testUtils } from '@helpers';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { TestApp } from './../../../helpers/tests.utils';

describe('POST /auth/get-account-to-activate/:userId/', () => {
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
        .post(authRoute.getAccountToActivatePath + '/' + Guid.EMPTY)
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
        .post(authRoute.getAccountToActivatePath + '/' + uuid)
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
      const user = testUtils.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();

      const activateUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, passcode: user.passcode + 'invalid_passcode' };

      for (let index = 1; index < USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app!.getServer()).post(authRoute.loginPath).send(loginData);
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
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, passcode: user.passcode + 'invalid_passcode' } satisfies LoginDto);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = loginResponse.body.data as BadRequestException;
      expect(typeof data).toBe('object');
      const { message: login1Message }: { message: string } = data;
      expect(login1Message).toBe(errorKeys.login.Account_Is_Locked_Out);

      const toActivateResponse = await request(app!.getServer())
        .post(authRoute.getAccountToActivatePath + '/' + newUserDto.id)
        .send();
      expect(toActivateResponse.statusCode).toBe(200);
      const body = toActivateResponse.body as GetAccountToActivateResponseDto;
      expect(typeof body).toBe('object');
      const { data: toActivateResult } = body;
      expect(toActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IAccountToActivateResultDto);

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
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('when user with given id is inactive and is lockedOut', async () => {
      const user = testUtils.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();

      const activateUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, passcode: user.passcode + 'invalid_passcode' };

      for (let index = 1; index < USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app!.getServer()).post(authRoute.loginPath).send(loginData);
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
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, passcode: user.passcode + 'invalid_passcode' } satisfies LoginDto);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = loginResponse.body.data as BadRequestException;
      expect(typeof data).toBe('object');
      const { message: login1Message }: { message: string } = data;
      expect(login1Message).toBe(errorKeys.login.Account_Is_Locked_Out);

      const deactivateUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateUserResponse.statusCode).toBe(200);

      const toActivateResponse = await request(app!.getServer())
        .post(authRoute.getAccountToActivatePath + '/' + newUserDto.id)
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
        ...testUtils.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      } satisfies CreateUserDto;

      const createResponse = await request(app!.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();

      const toActivateResponse = await request(app!.getServer())
        .post(authRoute.getAccountToActivatePath + '/' + newUserDto.id)
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
        .post(authRoute.getAccountToActivatePath + '/invalidUserId')
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
