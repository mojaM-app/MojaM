import { events, ILoginModel, IRequestWithIdentity } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { setIdentity } from '@middlewares';
import { LoginResponseDto } from '@modules/auth';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import * as Utils from '@utils';
import { getAdminLoginData } from '@utils';
import { NextFunction } from 'express';
import { decode } from 'jsonwebtoken';
import ms from 'ms';
import StatusCode from 'status-code-enum';
import request from 'supertest';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import {
  getAccessTokenExpiration,
  getRefreshTokenExpiration,
} from '../../../middlewares/authorization/set-identity.middleware';
import { ActivateAccountDto, ActivateAccountResponseDto } from '../dtos/activate-account.dto';
import { RefreshTokenDto, RefreshTokenResponseDto } from '../dtos/refresh-token.dto';
import { AuthRoute } from '../routes/auth.routes';

describe('POST /auth/refresh-token', () => {
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

  describe('new access token should be generated', () => {
    it('when current access token is expired', async () => {
      const { email, passcode } = getAdminLoginData();
      const loginResponse = await app!.auth.login({
        email,
        passcode,
      } satisfies ILoginModel);
      const body: LoginResponseDto = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(email);
      expect(userLoggedIn.accessToken).toBeDefined();
      expect(userLoggedIn.refreshToken).toBeDefined();
      const req = {
        headers: {
          Authorization: `Bearer ${userLoggedIn.accessToken}`,
        },
      };
      const next: NextFunction = jest.fn();
      await setIdentity(req as any, {} as any, next);
      expect((req as unknown as IRequestWithIdentity).identity!.userUuid).toEqual(userLoggedIn.id);
      expect((req as unknown as IRequestWithIdentity).identity!.canEditUser()).toBeTruthy();
      expect(next).toHaveBeenCalled();

      const accessToken = decode(userLoggedIn.accessToken, { json: true });
      expect(accessToken).toBeDefined();
      expect(accessToken?.aud).toBeDefined();
      expect(accessToken?.iss).toBeDefined();
      expect(accessToken?.iat).toBeDefined();
      expect(accessToken?.exp).toBeDefined();
      expect(accessToken?.sub).toBeDefined();
      expect(accessToken?.sub).toBe(userLoggedIn.id);
      expect(accessToken?.userName).toBeDefined();
      expect(accessToken?.permissions).toBeDefined();

      const refreshToken = decode(userLoggedIn.refreshToken, { json: true });
      expect(refreshToken).toBeDefined();
      expect(refreshToken?.aud).toBeDefined();
      expect(refreshToken?.aud).toBe(accessToken?.aud);
      expect(refreshToken?.iss).toBeDefined();
      expect(refreshToken?.iss).toBe(accessToken?.iss);
      expect(refreshToken?.iat).toBeDefined();
      expect(refreshToken?.iat).toBe(accessToken?.iat);
      expect(refreshToken?.exp).toBeDefined();
      expect(refreshToken?.exp).not.toBe(accessToken?.exp);
      expect(refreshToken?.sub).toBeDefined();
      expect(refreshToken?.sub).toBe(userLoggedIn.id);
      expect(refreshToken?.userName).toBeUndefined();
      expect(refreshToken?.permissions).toBeUndefined();

      const expirationPeriod = ms(getAccessTokenExpiration());
      const expirationDate = new Date(Utils.getDateTimeNow().getTime() + expirationPeriod + 1);
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date(expirationDate));

      const user = userTestHelpers.generateValidUserWithPassword();
      let createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(401);

      const refreshTokenResponse = await request(app!.getServer())
        .post(AuthRoute.refreshTokenPath)
        .send({
          refreshToken: userLoggedIn.refreshToken,
          accessToken: userLoggedIn.accessToken,
        } satisfies RefreshTokenDto);
      expect(refreshTokenResponse.statusCode).toBe(200);
      const { data: newAccessToken, message: userRefreshedTokenMessage }: RefreshTokenResponseDto =
        refreshTokenResponse.body;
      expect(userRefreshedTokenMessage).toBe(events.users.userRefreshedToken);
      expect(newAccessToken).toBeDefined();

      createUserResponse = await app!.user.create(user, newAccessToken!);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, newAccessToken!);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);

      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserRefreshedToken,
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  describe('new access token should NOT be generated', () => {
    it('when current: refresh and access token are expired', async () => {
      const { email, passcode } = getAdminLoginData();
      const loginResponse = await app!.auth.login({
        email,
        passcode,
      } satisfies ILoginModel);
      const body: LoginResponseDto = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(email);
      expect(userLoggedIn.accessToken).toBeDefined();
      expect(userLoggedIn.refreshToken).toBeDefined();
      const req = {
        headers: {
          Authorization: `Bearer ${userLoggedIn.accessToken}`,
        },
      };
      const next: NextFunction = jest.fn();
      await setIdentity(req as any, {} as any, next);
      expect((req as unknown as IRequestWithIdentity).identity!.userUuid).toEqual(userLoggedIn.id);
      expect((req as unknown as IRequestWithIdentity).identity!.canEditUser()).toBeTruthy();
      expect(next).toHaveBeenCalled();

      const accessToken = decode(userLoggedIn.accessToken, { json: true });
      expect(accessToken).toBeDefined();
      expect(accessToken?.aud).toBeDefined();
      expect(accessToken?.iss).toBeDefined();
      expect(accessToken?.iat).toBeDefined();
      expect(accessToken?.exp).toBeDefined();
      expect(accessToken?.sub).toBeDefined();
      expect(accessToken?.sub).toBe(userLoggedIn.id);
      expect(accessToken?.userName).toBeDefined();
      expect(accessToken?.permissions).toBeDefined();

      const refreshToken = decode(userLoggedIn.refreshToken, { json: true });
      expect(refreshToken).toBeDefined();
      expect(refreshToken?.aud).toBeDefined();
      expect(refreshToken?.aud).toBe(accessToken?.aud);
      expect(refreshToken?.iss).toBeDefined();
      expect(refreshToken?.iss).toBe(accessToken?.iss);
      expect(refreshToken?.iat).toBeDefined();
      expect(refreshToken?.iat).toBe(accessToken?.iat);
      expect(refreshToken?.exp).toBeDefined();
      expect(refreshToken?.exp).not.toBe(accessToken?.exp);
      expect(refreshToken?.sub).toBeDefined();
      expect(refreshToken?.sub).toBe(userLoggedIn.id);
      expect(refreshToken?.userName).toBeUndefined();
      expect(refreshToken?.permissions).toBeUndefined();

      const expirationPeriod = Math.max(ms(getAccessTokenExpiration()), ms(getRefreshTokenExpiration()));
      const expirationDate = new Date(Utils.getDateTimeNow().getTime() + expirationPeriod + 1);
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date(expirationDate));

      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(401);

      const refreshTokenResponse = await request(app!.getServer())
        .post(AuthRoute.refreshTokenPath)
        .send({
          refreshToken: userLoggedIn.refreshToken,
          accessToken: userLoggedIn.accessToken,
        } satisfies RefreshTokenDto);
      expect(refreshTokenResponse.statusCode).toBe(StatusCode.ClientErrorLoginTimeOut);
      const data = refreshTokenResponse.body.data as BadRequestException;
      expect(typeof data).toBe('object');
      const { message: refreshTokenMessage }: { message: string } = data;
      expect(refreshTokenMessage).toBe(errorKeys.login.Refresh_Token_Expired);

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserLoggedIn].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('when refresh token is empty', async () => {
      const { email, passcode } = getAdminLoginData();
      const loginResponse = await app!.auth.login({
        email,
        passcode,
      } satisfies ILoginModel);
      const body: LoginResponseDto = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(email);
      expect(userLoggedIn.accessToken).toBeDefined();
      expect(userLoggedIn.refreshToken).toBeDefined();
      const req = {
        headers: {
          Authorization: `Bearer ${userLoggedIn.accessToken}`,
        },
      };
      const next: NextFunction = jest.fn();
      await setIdentity(req as any, {} as any, next);
      expect((req as unknown as IRequestWithIdentity).identity!.userUuid).toEqual(userLoggedIn.id);
      expect((req as unknown as IRequestWithIdentity).identity!.canEditUser()).toBeTruthy();
      expect(next).toHaveBeenCalled();

      const expirationPeriod = Math.max(ms(getAccessTokenExpiration()), ms(getRefreshTokenExpiration()));
      const expirationDate = new Date(Utils.getDateTimeNow().getTime() + expirationPeriod + 1);
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date(expirationDate));

      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(user, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(401);

      const refreshTokenResponse = await request(app!.getServer())
        .post(AuthRoute.refreshTokenPath)
        .send({
          refreshToken: '',
          accessToken: userLoggedIn.accessToken,
        } satisfies RefreshTokenDto);
      expect(refreshTokenResponse.statusCode).toBe(200);
      const { data: newAccessToken, message: userRefreshedTokenMessage }: RefreshTokenResponseDto =
        refreshTokenResponse.body;
      expect(userRefreshedTokenMessage).toBe(events.users.userRefreshedToken);
      expect(newAccessToken).toBeNull();

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserLoggedIn].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserRefreshedToken).not.toHaveBeenCalled();
    });

    it('when user stored in refresh token not exists', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: newUserDto }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();

      const activateResponse = await app!.auth.activateAccount(newUserDto.id, {} satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      });

      const newUserRefreshToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.refreshToken;
      expect(newUserRefreshToken).toBeDefined();

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      const refreshTokenResponse = await request(app!.getServer())
        .post(AuthRoute.refreshTokenPath)
        .send({
          refreshToken: newUserRefreshToken,
          accessToken: adminAccessToken,
        } satisfies RefreshTokenDto);
      expect(refreshTokenResponse.statusCode).toBe(200);
      expect(refreshTokenResponse.body.data).toBeNull();

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
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
