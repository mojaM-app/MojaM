import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { CheckResetPasscodeTokenResponseDto } from '../dtos/check-reset-passcode-token.dto';
import { AuthRoute } from '../routes/auth.routes';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { TestApp } from './../../../helpers/tests.utils';

describe('POST /auth/check-reset-passcode-token/:userId/:token', () => {
  let app: TestApp | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('request should end with status code of 200', () => {
    it('when user with given id not exist', async () => {
      const response = await request(app!.getServer())
        .post(AuthRoute.checkResetPasscodeTokenPath + '/' + Guid.EMPTY + '/validToken')
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
      const response = await request(app!.getServer())
        .post(AuthRoute.checkResetPasscodeTokenPath + '/invalidUserId/validToken')
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
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
