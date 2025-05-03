import { EventDispatcherService } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-tests.helper';
import { loginAs } from '@helpers/user-tests.helpers';
import { AuthRoute, IUnlockAccountResultDto, LoginDto, UnlockAccountResponseDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { UserRoute } from '@modules/users';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { App } from '../../../app';

describe('POST /auth/unlock-account/', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let mockSendMail: any;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute]);
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

  describe('request should end with status code of 200', () => {
    it('when user with given id not exist', async () => {
      const response = await request(app.getServer())
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

    it('when user with given id exist and is not locked out', async () => {});

    it('when user with given id exist and is locked out', async () => {});
  });

  describe('request should end with status code of 404', () => {
    it('when user id is invalid', async () => {
      const response = await request(app.getServer())
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
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
