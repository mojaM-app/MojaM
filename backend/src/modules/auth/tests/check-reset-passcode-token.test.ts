/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { EventDispatcherService } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { AuthRoute, CheckResetPasscodeTokenResponseDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { UserRoute } from '@modules/users';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { App } from './../../../app';

describe('POST /auth/check-reset-passcode-token/:userId/:token', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  // let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute]);
    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  describe('request should end with status code of 200', () => {
    it('when user with given id not exist', async () => {
      const response = await request(app.getServer())
        .post(authRoute.checkResetPasscodeTokenPath + '/' + Guid.EMPTY + '/validToken')
        .send();
      expect(response.statusCode).toBe(200);
      const body = response.body as CheckResetPasscodeTokenResponseDto;
      expect(typeof body).toBe('object');
      const { data: checkResetPasscodeTokenResult } = body;
      expect(checkResetPasscodeTokenResult.isValid).toBe(false);
      expect(checkResetPasscodeTokenResult.userEmail).toBeUndefined();
      expect(checkResetPasscodeTokenResult.authType).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('request should end with status code of 404', () => {
    it('when user id is invalid', async () => {
      const response = await request(app.getServer())
        .post(authRoute.checkResetPasscodeTokenPath + '/invalidUserId/validToken')
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
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
