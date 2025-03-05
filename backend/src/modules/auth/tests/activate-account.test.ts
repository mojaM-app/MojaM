/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { loginAs } from '@helpers/user-tests.helpers';
import { ActivateAccountDto, AuthRoute, LoginDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { UserRoute } from '@modules/users';
import { generateRandomDate, generateRandomPassword, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import nodemailer from 'nodemailer';
import request from 'supertest';

describe('POST /auth/activate-account/', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let mockSendMail: any;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute]);
    const { email, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, password } satisfies LoginDto))?.accessToken;

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

  // describe('request should end with status code od 200', () => {
  //   it('when user with given id not exist', async () => {
  //     const response = await request(app.getServer())
  //       .post(authRoute.getUserToActivatePath + '/' + Guid.EMPTY)
  //       .send();
  //     expect(response.statusCode).toBe(200);
  //     const body = response.body as GetUserToActivateResponseDto;
  //     expect(typeof body).toBe('object');
  //     const { data: userToActivateResult } = body;
  //     expect(userToActivateResult).toStrictEqual({
  //       isActive: true,
  //     });

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   it('when user with given id is active', async () => {
  //     const { uuid } = getAdminLoginData();
  //     const response = await request(app.getServer())
  //       .post(authRoute.getUserToActivatePath + '/' + uuid)
  //       .send();
  //     expect(response.statusCode).toBe(200);
  //     const body = response.body as GetUserToActivateResponseDto;
  //     expect(typeof body).toBe('object');
  //     const { data: userToActivateResult } = body;
  //     expect(userToActivateResult).toStrictEqual({
  //       isActive: true,
  //     });

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   it('when user with given id is active and is lockedOut', async () => {
  //     const user = generateValidUser();

  //     const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createResponse.statusCode).toBe(201);
  //     const { data: newUserDto }: CreateUserResponseDto = createResponse.body;
  //     expect(newUserDto?.id).toBeDefined();

  //     const activateUserResponse = await request(app.getServer())
  //       .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(activateUserResponse.statusCode).toBe(200);

  //     const loginData: LoginDto = { email: newUserDto.email, password: user.password + 'invalid_password' };

  //     for (let index = 1; index <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
  //       const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
  //       expect(loginResponse.statusCode).toBe(400);
  //       expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
  //       const body = loginResponse.body;
  //       expect(typeof body).toBe('object');
  //       const data = body.data as BadRequestException;
  //       const { message: loginMessage, args: loginArgs } = data;
  //       expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
  //       expect(loginArgs).toBeUndefined();
  //     }

  //     const getUserToActivateResponse = await request(app.getServer())
  //       .post(authRoute.getUserToActivatePath + '/' + newUserDto.id)
  //       .send();
  //     expect(getUserToActivateResponse.statusCode).toBe(200);
  //     const body = getUserToActivateResponse.body as GetUserToActivateResponseDto;
  //     expect(typeof body).toBe('object');
  //     const { data: userToActivateResult } = body;
  //     expect(userToActivateResult).toStrictEqual({
  //       isActive: true,
  //     });

  //     const deleteResponse = await request(app.getServer())
  //       .delete(userRoute.path + '/' + newUserDto.id)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(deleteResponse.statusCode).toBe(200);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers)
  //       .filter(
  //         ([, eventHandler]) =>
  //           ![
  //             testEventHandlers.onUserCreated,
  //             testEventHandlers.onUserActivated,
  //             testEventHandlers.onFailedLoginAttempt,
  //             testEventHandlers.onUserLockedOut,
  //             testEventHandlers.lockedUserTriesToLogIn,
  //             testEventHandlers.onUserDeleted,
  //           ].includes(eventHandler),
  //       )
  //       .forEach(([, eventHandler]) => {
  //         expect(eventHandler).not.toHaveBeenCalled();
  //       });
  //   });

  //   it('when user with given id is inactive and is lockedOut', async () => {
  //     const user = generateValidUser();

  //     const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createResponse.statusCode).toBe(201);
  //     const { data: newUserDto }: CreateUserResponseDto = createResponse.body;
  //     expect(newUserDto?.id).toBeDefined();

  //     const activateUserResponse = await request(app.getServer())
  //       .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(activateUserResponse.statusCode).toBe(200);

  //     const loginData: LoginDto = { email: newUserDto.email, password: user.password + 'invalid_password' };

  //     for (let index = 1; index <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
  //       const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
  //       expect(loginResponse.statusCode).toBe(400);
  //       expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
  //       const body = loginResponse.body;
  //       expect(typeof body).toBe('object');
  //       const data = body.data as BadRequestException;
  //       const { message: loginMessage, args: loginArgs } = data;
  //       expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
  //       expect(loginArgs).toBeUndefined();
  //     }

  //     const deactivateUserResponse = await request(app.getServer())
  //       .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.deactivatePath)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(deactivateUserResponse.statusCode).toBe(200);

  //     const getUserToActivateResponse = await request(app.getServer())
  //       .post(authRoute.getUserToActivatePath + '/' + newUserDto.id)
  //       .send();
  //     expect(getUserToActivateResponse.statusCode).toBe(200);
  //     const body = getUserToActivateResponse.body as GetUserToActivateResponseDto;
  //     expect(typeof body).toBe('object');
  //     const { data: userToActivateResult } = body;
  //     expect(userToActivateResult).toStrictEqual({
  //       isActive: false,
  //       isLockedOut: true,
  //     });

  //     const deleteResponse = await request(app.getServer())
  //       .delete(userRoute.path + '/' + newUserDto.id)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(deleteResponse.statusCode).toBe(200);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers)
  //       .filter(
  //         ([, eventHandler]) =>
  //           ![
  //             testEventHandlers.onUserCreated,
  //             testEventHandlers.onUserActivated,
  //             testEventHandlers.onFailedLoginAttempt,
  //             testEventHandlers.onUserLockedOut,
  //             testEventHandlers.lockedUserTriesToLogIn,
  //             testEventHandlers.onUserDeactivated,
  //             testEventHandlers.onUserDeleted,
  //           ].includes(eventHandler),
  //       )
  //       .forEach(([, eventHandler]) => {
  //         expect(eventHandler).not.toHaveBeenCalled();
  //       });
  //   });
  // });

  describe('request should end with status code od 400', () => {
    it('when password is invalid', async () => {
      const model = { firstName: 'John', lastName: 'Smith', joiningDate: generateRandomDate() };
      const bodyData = [
        { ...model, password: null as any } satisfies ActivateAccountDto,
        { ...model, password: undefined as any } satisfies ActivateAccountDto,
        { ...model, password: '' } satisfies ActivateAccountDto,
        { ...model, password: 'invalid password' } satisfies ActivateAccountDto,
        { ...model, password: 123 as any } satisfies ActivateAccountDto,
        { ...model, password: true as any } satisfies ActivateAccountDto,
        { ...model, password: [] as any } satisfies ActivateAccountDto,
        { ...model, password: {} as any } satisfies ActivateAccountDto,
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer())
          .post(authRoute.activateAccountPath + '/' + Guid.EMPTY)
          .send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => x !== errorKeys.users.Invalid_Password).length).toBe(0);

        // checking events running via eventDispatcher
        Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      }
    });

    it('when firstName is invalid', async () => {
      const model = { lastName: 'Smith', joiningDate: generateRandomDate(), password: generateRandomPassword() };
      const bodyData = [
        { ...model, firstName: 123 as any } satisfies ActivateAccountDto,
        { ...model, firstName: true as any } satisfies ActivateAccountDto,
        { ...model, firstName: [] as any } satisfies ActivateAccountDto,
        { ...model, firstName: {} as any } satisfies ActivateAccountDto,
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer())
          .post(authRoute.activateAccountPath + '/' + Guid.EMPTY)
          .send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => !x.includes('Name')).length).toBe(0);

        // checking events running via eventDispatcher
        Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      }
    });

    it('when lastName is invalid', async () => {
      const model = { firstName: 'John', joiningDate: generateRandomDate(), password: generateRandomPassword() };
      const bodyData = [
        { ...model, lastName: 123 as any } satisfies ActivateAccountDto,
        { ...model, lastName: true as any } satisfies ActivateAccountDto,
        { ...model, lastName: [] as any } satisfies ActivateAccountDto,
        { ...model, lastName: {} as any } satisfies ActivateAccountDto,
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer())
          .post(authRoute.activateAccountPath + '/' + Guid.EMPTY)
          .send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => !x.includes('Name')).length).toBe(0);

        // checking events running via eventDispatcher
        Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      }
    });

    it('when joiningDate is invalid', async () => {
      const model = { firstName: 'John', lastName: 'Smith', password: generateRandomPassword() };
      const bodyData = [
        { ...model, joiningDate: 'some text' as any } satisfies ActivateAccountDto,
        { ...model, joiningDate: [] as any } satisfies ActivateAccountDto,
        { ...model, joiningDate: {} as any } satisfies ActivateAccountDto,
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer())
          .post(authRoute.activateAccountPath + '/' + Guid.EMPTY)
          .send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => !x.includes('JoiningDate')).length).toBe(0);

        // checking events running via eventDispatcher
        Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      }
    });
  });

  describe('request should end with status code od 404', () => {
    it('when user id is invalid', async () => {
      const response = await request(app.getServer())
        .post(authRoute.activateAccountPath + '/invalidUserId')
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
