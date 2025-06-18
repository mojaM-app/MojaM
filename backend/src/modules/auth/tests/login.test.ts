import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { events, ILoginModel, IRequestWithIdentity, RouteConstants } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { setIdentity } from '@middlewares';
import { LoginResponseDto } from '@modules/auth';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { generateRandomEmail, generateRandomPassword, getAdminLoginData } from '@utils';
import { NextFunction } from 'express';
import { decode } from 'jsonwebtoken';
import request from 'supertest';
import { AuthRoute } from '../routes/auth.routes';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { TestApp } from './../../../helpers/tests.utils';

describe('POST /login', () => {
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

  describe('when login data are valid', () => {
    it('(login via email and passcode) response should have set the Authorization token when login data are correct', async () => {
      const { email, passcode } = getAdminLoginData();
      const loginResponse = await request(app!.getServer())
        .post(AuthRoute.loginPath)
        .send({ email, passcode } satisfies ILoginModel);
      const body: LoginResponseDto = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage }: LoginResponseDto = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(email);
      expect(userLoggedIn.accessToken).toBeDefined();
      const req = {
        headers: {
          Authorization: `Bearer ${userLoggedIn.accessToken}`,
        },
      };
      const next: NextFunction = jest.fn();
      await setIdentity(req as any, {} as any, next);
      expect((req as unknown as IRequestWithIdentity).identity.userUuid).toEqual(userLoggedIn.id);
      expect((req as unknown as IRequestWithIdentity).identity.canEditUser()).toBeTruthy();
      expect(next).toHaveBeenCalled();

      const token = decode(userLoggedIn.accessToken, { json: true });
      expect(token).toBeDefined();
      expect(token?.aud).toBeDefined();
      expect(token?.iss).toBeDefined();
      expect(token?.iat).toBeDefined();
      expect(token?.exp).toBeDefined();
      expect(token?.sub).toBeDefined();
      expect(token?.sub).toBe(userLoggedIn.id);
      expect(token?.userName).toBeDefined();
      expect(token?.permissions).toBeDefined();

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserLoggedIn].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('(login via email, phone and passcode) response should have set the Authorization token when login data are correct', async () => {
      const { email, phone, passcode } = getAdminLoginData();
      const loginResponse = await request(app!.getServer())
        .post(AuthRoute.loginPath)
        .send({ email, phone, passcode } satisfies ILoginModel);
      const body: LoginResponseDto = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(email);
      expect(userLoggedIn.phone).toBe(phone);
      expect(userLoggedIn.accessToken).toBeDefined();
      const req = {
        headers: {
          Authorization: `Bearer ${userLoggedIn.accessToken}`,
        },
      };
      const next: NextFunction = jest.fn();
      await setIdentity(req as any, {} as any, next);
      expect((req as unknown as IRequestWithIdentity).identity.userUuid).toEqual(userLoggedIn.id);
      expect((req as unknown as IRequestWithIdentity).identity.canEditUser()).toBeTruthy();
      expect(next).toHaveBeenCalled();

      const token = decode(userLoggedIn.accessToken, { json: true });
      expect(token).toBeDefined();
      expect(token?.aud).toBeDefined();
      expect(token?.iss).toBeDefined();
      expect(token?.iat).toBeDefined();
      expect(token?.exp).toBeDefined();
      expect(token?.sub).toBeDefined();
      expect(token?.sub).toBe(userLoggedIn.id);
      expect(token?.userName).toBeDefined();
      expect(token?.permissions).toBeDefined();

      // checking events running via eventDispatcher
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserLoggedIn].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('(login via email and password) case when exist more then one user with same phone', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      const user2 = userTestHelpers.generateValidUserWithPassword();
      const phone = user1.phone;
      user2.phone = phone;
      expect(user1.phone).toBe(user2.phone);
      expect(user1.email).not.toBe(user2.email);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.phone).toBe(phone);

      let activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser1Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.phone).toBe(phone);

      activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser2Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.phone).toBe(newUser2Dto.phone);
      expect(newUser1Dto.email).not.toBe(newUser2Dto.email);

      const loginData: ILoginModel = { email: user1.email, passcode: user1.passcode };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      const body: LoginResponseDto = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(user1.email);
      expect(userLoggedIn.phone).toBe(phone);
      expect(userLoggedIn.accessToken).toBeDefined();

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
    });

    it('(login via email, phone and password) case when exist more then one user with same phone', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      const user2 = userTestHelpers.generateValidUserWithPassword();
      const phone = user1.phone;
      user2.phone = phone;
      expect(user1.phone).toBe(user2.phone);
      expect(user1.email).not.toBe(user2.email);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.phone).toBe(phone);

      let activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser1Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.phone).toBe(phone);

      activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser2Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.phone).toBe(newUser2Dto.phone);
      expect(newUser1Dto.email).not.toBe(newUser2Dto.email);

      const loginData: ILoginModel = { email: user1.email, phone: user1.phone, passcode: user1.passcode };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      const body: LoginResponseDto = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(user1.email);
      expect(userLoggedIn.phone).toBe(phone);
      expect(userLoggedIn.accessToken).toBeDefined();

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
    });

    it('(login via email, phone and password) case when exist more then one user with same email', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      const user2 = userTestHelpers.generateValidUserWithPassword();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser1Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser2Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);
      expect(newUser1Dto.phone).not.toBe(newUser2Dto.phone);

      const loginData: ILoginModel = { email, phone: user1.phone, passcode: user1.passcode };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body: LoginResponseDto = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.phone).toBe(user1.phone);
      expect(userLoggedIn.email).toBe(email);
      expect(userLoggedIn.accessToken).toBeDefined();

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('when exist more then one user with same login', () => {
    it('login via email should respond with a status code of 400 when exist more then one user with same email', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      const user2 = userTestHelpers.generateValidUserWithPassword();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser1Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser2Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);
      expect(newUser1Dto.phone).not.toBe(newUser2Dto.phone);

      const loginData: ILoginModel = { email, passcode: user1.passcode };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
      expect(loginArgs).toBeUndefined();

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(2);
    });
  });

  describe('when login data are invalid', () => {
    it('should respond with a status code of 400 when login is invalid', async () => {
      const model = { passcode: 'strongPassword1@', email: generateRandomEmail() } satisfies ILoginModel;

      const bodyData = [
        { ...model, email: null } satisfies ILoginModel,
        { ...model, email: undefined } satisfies ILoginModel,
        { ...model, email: '' } satisfies ILoginModel,
        { ...model, email: 123 as any } satisfies ILoginModel,
        { ...model, email: true as any } satisfies ILoginModel,
        { ...model, email: [] as any } satisfies ILoginModel,
        { ...model, email: {} as any } satisfies ILoginModel,
      ];

      for (const body of bodyData) {
        const response = await request(app!.getServer()).post(AuthRoute.loginPath).send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => !x.includes('Login')).length).toBe(0);
      }

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('should respond with a status code of 400 when passcode is invalid', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const model = { email: user.email, passcode: generateRandomPassword() } satisfies ILoginModel;

      const bodyData = [
        { ...model, passcode: null } satisfies ILoginModel,
        { ...model, passcode: undefined } satisfies ILoginModel,
        { ...model, passcode: '' } satisfies ILoginModel,
        { ...model, passcode: 'V3ry looooooooooooooooooooong passwooooooooooord!12' } satisfies ILoginModel,
        { ...model, passcode: 1234 as any } satisfies ILoginModel,
        { ...model, passcode: true as any } satisfies ILoginModel,
        { ...model, passcode: [] as any } satisfies ILoginModel,
        { ...model, passcode: {} as any } satisfies ILoginModel,
      ];

      for (const body of bodyData) {
        const response = await request(app!.getServer()).post(AuthRoute.loginPath).send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => !x.includes('Passcode')).length).toBe(0);
      }

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('should respond with a status code of 400 when user with given email not exist', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const loginData: ILoginModel = { email: user.email, passcode: user.passcode };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
      expect(loginArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('should respond with a status code of 400 when user with given phone not exist', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const loginData: ILoginModel = { email: user.phone, passcode: user.passcode };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
      expect(loginArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('login (via email) should respond with a status code of 400 when password is incorrect', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, passcode: user.passcode + 'invalid_password' };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
      expect(loginArgs).toBeUndefined();

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
              testEventHandlers.onUserDeleted,
              testEventHandlers.onFailedLoginAttempt,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('login (via email and phone) should respond with a status code of 400 when password is incorrect', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, phone: newUserDto.phone, passcode: user.passcode + 'invalid_password' };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
      expect(loginArgs).toBeUndefined();

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
              testEventHandlers.onUserDeleted,
              testEventHandlers.onFailedLoginAttempt,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('login (via email) x-times should lock-out the user and should respond with a status code of 400 when password is incorrect', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, passcode: user.passcode + 'invalid_password' };

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

      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Account_Is_Locked_Out);
      expect(loginArgs).toBeUndefined();

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
              testEventHandlers.onUserDeleted,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserLockedOut,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS);
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('login (via email and phone) x-times should lock-out the user and should respond with a status code of 400 when password is incorrect', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, phone: newUserDto.phone, passcode: user.passcode + 'invalid_password' };

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

      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Account_Is_Locked_Out);
      expect(loginArgs).toBeUndefined();

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
              testEventHandlers.onUserDeleted,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserLockedOut,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS);
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('login should response with status code of 400 when user has no passcode', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      requestData.passcode = undefined;
      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const loginData: ILoginModel = { email: user.email, passcode: 'some_StrongP@ssword!' };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Passcode_Is_Not_Set);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('login should respond with a status code of 400 when try to login to a locked out account', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, phone: newUserDto.phone, passcode: user.passcode + 'invalid_password' };

      for (let index = 1; index <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
      }

      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Account_Is_Locked_Out);
      expect(loginArgs).toBeUndefined();

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
              testEventHandlers.onUserDeleted,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserLockedOut,
              testEventHandlers.lockedUserTriesToLogIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS);
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.lockedUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('when user is not active', () => {
    it('should respond with a status code of 400 when user is not active and passcode is correct', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_DEACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, passcode: user.passcode };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Not_Active);
      expect(loginArgs).toBeUndefined();

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
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserDeactivated,
              testEventHandlers.inactiveUserTriesToLogIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).not.toHaveBeenCalled();
      expect(testEventHandlers.inactiveUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('should respond with a status code of 400 when user is not active and passcode is incorrect', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_DEACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, passcode: user.passcode + 'invalid-passcode' };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Not_Active);
      expect(loginArgs).toBeUndefined();

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
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserDeactivated,
              testEventHandlers.inactiveUserTriesToLogIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).not.toHaveBeenCalled();
      expect(testEventHandlers.inactiveUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('when user is deleted', () => {
    it('should respond with a status code of 400 when user is deleted', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      const loginData: ILoginModel = { email: newUserDto.email, passcode: user.passcode };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
      expect(loginArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
