/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import {
  AccountTryingToLogInDto,
  ActivateAccountDto,
  ActivateAccountResponseDto,
  AuthRoute,
  GetAccountBeforeLogInResponseDto,
  IGetAccountBeforeLogInResultDto,
  LoginDto,
} from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, GetUserResponseDto, UserRoute } from '@modules/users';
import { generateRandomDate, generateRandomPassword, generateRandomString, getAdminLoginData } from '@utils/tests.utils';
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

  describe('request should end with status code of 200', () => {
    it('when user with given id not exist', async () => {
      const model = {
        firstName: 'John',
        lastName: 'Smith',
        password: generateRandomPassword(),
        joiningDate: generateRandomDate(),
      } satisfies ActivateAccountDto;
      const response = await request(app.getServer())
        .post(authRoute.activateAccountPath + '/' + Guid.EMPTY)
        .send(model);
      expect(response.statusCode).toBe(200);
      const body = response.body as ActivateAccountResponseDto;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult } = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      });
      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user with given id is active', async () => {
      const { uuid, email } = getAdminLoginData();
      let response = await request(app.getServer())
        .post(authRoute.activateAccountPath + '/' + uuid)
        .send({} satisfies ActivateAccountDto);
      expect(response.statusCode).toBe(200);
      let body = response.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult } = body as ActivateAccountResponseDto;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      });

      response = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      body = response.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserActivated].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
    });

    it('while activating when password is NULL, password should not be changed', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateResponse = await request(app.getServer())
        .post(authRoute.activateAccountPath + '/' + user.id)
        .send({
          password: null as any,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;
      expect(newUserAccessToken).toBeDefined();

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
    });

    it('while activating when password is UNDEFINED, password should not be changed', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateResponse = await request(app.getServer())
        .post(authRoute.activateAccountPath + '/' + user.id)
        .send({
          password: undefined as any,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;
      expect(newUserAccessToken).toBeDefined();

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
    });

    it('while activating when password is empty, password should not be changed', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateResponse = await request(app.getServer())
        .post(authRoute.activateAccountPath + '/' + user.id)
        .send({
          password: '',
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;
      expect(newUserAccessToken).toBeDefined();

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
    });

    it('while activating when password is set, password should be changed', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const password = generateRandomPassword();
      const activateResponse = await request(app.getServer())
        .post(authRoute.activateAccountPath + '/' + user.id)
        .send({
          password,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      });

      const loginData: LoginDto = { email: requestData.email, password: requestData.password };
      let loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);

      loginData.password = password;
      loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(200);

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
    });

    it('while activating when first and last name are set, first and last name should be set', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const firstName = generateRandomString();
      const lastName = generateRandomString();
      const activateResponse = await request(app.getServer())
        .post(authRoute.activateAccountPath + '/' + user.id)
        .send({
          firstName,
          lastName,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      });

      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserResponse.statusCode).toBe(200);
      body = getUserResponse.body;
      const { data: newUser }: GetUserResponseDto = body;
      expect(newUser).toBeDefined();
      expect(newUser!.firstName).toBe(firstName);
      expect(newUser!.lastName).toBe(lastName);

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
              testEventHandlers.onUserRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
    });

    it('while activating user without password, when password is set, password should be set', async () => {
      const requestData = generateValidUser();
      delete requestData.password;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      let getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: false, isPasswordSet: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false, isPasswordSet: false } satisfies IGetAccountBeforeLogInResultDto);

      const password = generateRandomPassword();
      const activateResponse = await request(app.getServer())
        .post(authRoute.activateAccountPath + '/' + user.id)
        .send({
          password,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      });

      const loginData: LoginDto = { email: requestData.email, password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(200);

      getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: true, isPasswordSet: true } satisfies IGetAccountBeforeLogInResultDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
    });
  });

  describe('request should end with status code of 400', () => {
    it('when password is invalid', async () => {
      const model = { firstName: 'John', lastName: 'Smith', joiningDate: generateRandomDate() };
      const bodyData = [
        // { ...model, password: null as any } satisfies ActivateAccountDto,
        // { ...model, password: undefined as any } satisfies ActivateAccountDto,
        // { ...model, password: '' } satisfies ActivateAccountDto,
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

  describe('request should end with status code of 404', () => {
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
