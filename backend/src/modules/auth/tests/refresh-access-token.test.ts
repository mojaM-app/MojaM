/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { errorKeys } from '@/exceptions';
import { EventDispatcherService, events } from '@events';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { IRequestWithIdentity } from '@interfaces';
import { AuthRoute, LoginDto, LoginResponseDto, RefreshTokenDto, RefreshTokenResponseDto, setIdentity, UserLoggedInEvent } from '@modules/auth';
import { userToIUser } from '@modules/common';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, UserRoute } from '@modules/users';
import * as Utils from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { NextFunction } from 'express';
import { decode } from 'jsonwebtoken';
import ms from 'ms';
import StatusCode from 'status-code-enum';
import request from 'supertest';
import { getAccessTokenExpiration, getRefreshTokenExpiration } from '../middlewares/set-identity.middleware';

describe('POST /auth/refresh-token', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();

  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    const { email, password } = getAdminLoginData();
    await app.initialize([userRoute, permissionsRoute]);

    adminAccessToken = (await loginAs(app, { email, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('new access token should be generated', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('when current access token is expired', async () => {
      const { email, password } = getAdminLoginData();
      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email, password } satisfies LoginDto);
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
      expect((req as unknown as IRequestWithIdentity).identity.userUuid).toEqual(userLoggedIn.id);
      expect((req as unknown as IRequestWithIdentity).identity.hasPermissionToEditUser()).toBeTruthy();
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

      const user = generateValidUser();
      let createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(401);

      const refreshTokenResponse = await request(app.getServer())
        .post(authRoute.refreshTokenPath)
        .send({
          refreshToken: userLoggedIn.refreshToken,
          accessToken: userLoggedIn.accessToken,
        } satisfies RefreshTokenDto);
      expect(refreshTokenResponse.statusCode).toBe(200);
      const { data: newAccessToken, message: userRefreshedTokenMessage }: RefreshTokenResponseDto = refreshTokenResponse.body;
      expect(userRefreshedTokenMessage).toBe(events.users.userRefreshedToken);
      expect(newAccessToken).toBeDefined();

      createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${newAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${newAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledWith(
        new UserLoggedInEvent(userToIUser({ ...userLoggedIn, uuid: userLoggedIn.id } as any)),
      );

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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('when current: refresh and access token are expired', async () => {
      const { email, password } = getAdminLoginData();
      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email, password } satisfies LoginDto);
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
      expect((req as unknown as IRequestWithIdentity).identity.userUuid).toEqual(userLoggedIn.id);
      expect((req as unknown as IRequestWithIdentity).identity.hasPermissionToEditUser()).toBeTruthy();
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

      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(401);

      const refreshTokenResponse = await request(app.getServer())
        .post(authRoute.refreshTokenPath)
        .send({
          refreshToken: userLoggedIn.refreshToken,
          accessToken: userLoggedIn.accessToken,
        } satisfies RefreshTokenDto);
      expect(refreshTokenResponse.statusCode).toBe(StatusCode.ClientErrorLoginTimeOut);
      const data = refreshTokenResponse.body.data as TranslatableHttpException;
      expect(typeof data).toBe('object');
      const { message: refreshTokenMessage }: { message: string } = data;
      expect(refreshTokenMessage).toBe(errorKeys.login.Refresh_Token_Expired);

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledWith(
        new UserLoggedInEvent(userToIUser({ ...userLoggedIn, uuid: userLoggedIn.id } as any)),
      );

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserLoggedIn].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('when refresh token is empty', async () => {
      const { email, password } = getAdminLoginData();
      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email, password } satisfies LoginDto);
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
      expect((req as unknown as IRequestWithIdentity).identity.userUuid).toEqual(userLoggedIn.id);
      expect((req as unknown as IRequestWithIdentity).identity.hasPermissionToEditUser()).toBeTruthy();
      expect(next).toHaveBeenCalled();

      const expirationPeriod = Math.max(ms(getAccessTokenExpiration()), ms(getRefreshTokenExpiration()));
      const expirationDate = new Date(Utils.getDateTimeNow().getTime() + expirationPeriod + 1);
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date(expirationDate));

      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(401);

      const refreshTokenResponse = await request(app.getServer())
        .post(authRoute.refreshTokenPath)
        .send({
          refreshToken: '',
          accessToken: userLoggedIn.accessToken,
        } satisfies RefreshTokenDto);
      expect(refreshTokenResponse.statusCode).toBe(200);
      const { data: newAccessToken, message: userRefreshedTokenMessage }: RefreshTokenResponseDto = refreshTokenResponse.body;
      expect(userRefreshedTokenMessage).toBe(events.users.userRefreshedToken);
      expect(newAccessToken).toBeNull();

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledWith(
        new UserLoggedInEvent(userToIUser({ ...userLoggedIn, uuid: userLoggedIn.id } as any)),
      );

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserLoggedIn].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserRefreshedToken).not.toHaveBeenCalled();
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});