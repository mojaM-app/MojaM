/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { IRequestWithIdentity } from '@interfaces';
import { AuthRoute, LoginDto, LoginResponseDto, setIdentity } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, UserRoute } from '@modules/users';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { NextFunction } from 'express';
import { decode } from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import request from 'supertest';

describe('POST /login', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let mockSendMail: any;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    const { email, password } = getAdminLoginData();
    await app.initialize([userRoute, permissionsRoute]);

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

  describe('when login data are valid', () => {
    it('(login via email and password) response should have set the Authorization token when login data are correct', async () => {
      const { email, password } = getAdminLoginData();
      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email, password } satisfies LoginDto);
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
      expect((req as unknown as IRequestWithIdentity).identity.hasPermissionToEditUser()).toBeTruthy();
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

    it('(login via email, phone and password) response should have set the Authorization token when login data are correct', async () => {
      const { email, phone, password } = getAdminLoginData();
      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email, phone, password } satisfies LoginDto);
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
      expect((req as unknown as IRequestWithIdentity).identity.hasPermissionToEditUser()).toBeTruthy();
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
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const phone = user1.phone;
      user2.phone = phone;
      expect(user1.phone).toBe(user2.phone);
      expect(user1.email).not.toBe(user2.email);

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.phone).toBe(phone);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser1Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.phone).toBe(phone);

      activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser2Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.phone).toBe(newUser2Dto.phone);
      expect(newUser1Dto.email).not.toBe(newUser2Dto.email);

      const loginData: LoginDto = { email: user1.email, password: user1.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
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

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser2Dto.id)
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
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const phone = user1.phone;
      user2.phone = phone;
      expect(user1.phone).toBe(user2.phone);
      expect(user1.email).not.toBe(user2.email);

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.phone).toBe(phone);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser1Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.phone).toBe(phone);

      activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser2Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.phone).toBe(newUser2Dto.phone);
      expect(newUser1Dto.email).not.toBe(newUser2Dto.email);

      const loginData: LoginDto = { email: user1.email, phone: user1.phone, password: user1.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
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

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser2Dto.id)
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
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser1Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser2Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);
      expect(newUser1Dto.phone).not.toBe(newUser2Dto.phone);

      const loginData: LoginDto = { email, phone: user1.phone, password: user1.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
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

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser2Dto.id)
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
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser1Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser2Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);
      expect(newUser1Dto.phone).not.toBe(newUser2Dto.phone);

      const loginData: LoginDto = { email, password: user1.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser2Dto.id)
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
      const model = { password: 'strongPassword1@' };

      const bodyData = [
        { ...model, email: null } satisfies LoginDto,
        { ...model, email: undefined } satisfies LoginDto,
        { ...model, email: '' } satisfies LoginDto,
        { ...model, email: 123 as any } satisfies LoginDto,
        { ...model, email: true as any } satisfies LoginDto,
        { ...model, email: [] as any } satisfies LoginDto,
        { ...model, email: {} as any } satisfies LoginDto,
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer()).post(authRoute.loginPath).send(body);
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

    it('should respond with a status code of 400 when password is invalid', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const model = { email: user.email };

      const bodyData = [
        { ...model, password: null } satisfies LoginDto,
        { ...model, password: undefined } satisfies LoginDto,
        { ...model, password: '' } satisfies LoginDto,
        { ...model, password: 'V3ry looooooooooooooooooooong passwooooooooooord!12' } satisfies LoginDto,
        { ...model, password: 1 as any } satisfies LoginDto,
        { ...model, password: true as any } satisfies LoginDto,
        { ...model, password: [] as any } satisfies LoginDto,
        { ...model, password: {} as any } satisfies LoginDto,
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer()).post(authRoute.loginPath).send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => !x.includes('Password')).length).toBe(0);
      }

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
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
      const user = generateValidUser();
      const loginData: LoginDto = { email: user.email, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('should respond with a status code of 400 when user with given phone not exist', async () => {
      const user = generateValidUser();
      const loginData: LoginDto = { email: user.phone, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('login (via email) should respond with a status code of 400 when password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, password: user.password + 'invalid_password' };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
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
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, phone: newUserDto.phone, password: user.password + 'invalid_password' };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
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
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, password: user.password + 'invalid_password' };

      for (let index = 1; index <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        const body = loginResponse.body;
        expect(typeof body).toBe('object');
        const data = body.data as BadRequestException;
        const { message: loginMessage, args: loginArgs } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
        expect(loginArgs).toBeUndefined();
      }

      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Locked_Out);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
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
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('login (via phone and phone) x-times should lock-out the user and should respond with a status code of 400 when password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, phone: newUserDto.phone, password: user.password + 'invalid_password' };

      for (let index = 1; index <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        const body = loginResponse.body;
        expect(typeof body).toBe('object');
        const data = body.data as BadRequestException;
        const { message: loginMessage, args: loginArgs } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
        expect(loginArgs).toBeUndefined();
      }

      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Locked_Out);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
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

    test('login should response with status code of 400 when user has no password', async () => {
      const requestData = generateValidUser();
      requestData.password = undefined;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const loginData: LoginDto = { email: user.email, password: 'some_StrongP@ssword!' };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Password_Is_Not_Set);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
  });

  describe('when user is not active', () => {
    it('should respond with a status code of 400 when user is not active and password is correct', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Not_Active);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
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

    it('should respond with a status code of 400 when user is not active and password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, password: user.password + 'invalid-password' };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Not_Active);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
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
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
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
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
