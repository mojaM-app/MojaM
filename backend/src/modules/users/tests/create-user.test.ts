/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { LoginDto } from '@modules/auth';
import { EmailService } from '@modules/notifications';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import { CreateUserDto, CreateUserResponseDto, IUserDto, UserRoute } from '@modules/users';
import { isGuid, isNumber } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';

describe('POST /user', () => {
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let mockSendMail: any;
  let adminAccessToken: string | undefined;
  let sendWelcomeEmailSpy: any;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute]);
    const { email, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.restoreAllMocks();

    mockSendMail = jest.fn().mockImplementation((mailOptions: any, callback: (error: any, info: any) => void) => {
      callback(null, null);
    });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
      close: jest.fn().mockImplementation(() => {}),
    } as any);

    sendWelcomeEmailSpy = jest.spyOn(EmailService.prototype, 'sendWelcomeEmail');
  });

  describe('POST should respond with a status code of 201', () => {
    test('when data are valid and user has permission', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(user.hasOwnProperty('password')).toBe(false);
      expect(user).toEqual({ id: user.id, email: user.email, phone: user.phone } satisfies IUserDto);
      expect(createMessage).toBe(events.users.userCreated);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

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

    test('when try to create user without password and user has permission', async () => {
      const requestData = generateValidUser();
      requestData.password = undefined;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(createMessage).toBe(events.users.userCreated);

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

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 400', () => {
    test('when password is invalid', async () => {
      const requestData = { email: 'email@domain.com', phone: '123456789', password: 'paasssword' } satisfies CreateUserDto;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(400);
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { message: createUserResponseMessage } = body.data as BadRequestException;
      const errors = createUserResponseMessage.split(',');
      expect(errors.filter(x => !x.includes('Password')).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });

      expect(sendWelcomeEmailSpy).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    test('when email is invalid', async () => {
      const requestData = { password: 'strongPassword1@', phone: '123456789', email: 'invalid email' } satisfies CreateUserDto;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(400);
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { message: createUserResponseMessage } = body.data as BadRequestException;
      const errors = createUserResponseMessage.split(',');
      expect(errors.filter(x => !x.includes('Email')).length).toBe(0);

      expect(sendWelcomeEmailSpy).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when phone is invalid', async () => {
      const requestData = { email: 'email@domain.com', password: 'strongPassword1@', phone: 'invalid phone' } satisfies CreateUserDto;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(400);
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { message: createUserResponseMessage } = body.data as BadRequestException;
      const errors = createUserResponseMessage.split(',');
      expect(errors.filter(x => !x.includes('Phone')).length).toBe(0);

      expect(sendWelcomeEmailSpy).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when exist user with same email and phone', async () => {
      const requestData = generateValidUser();
      const createUserResponse1 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user, message: createMessage }: CreateUserResponseDto = createUserResponse1.body;
      expect(createMessage).toBe(events.users.userCreated);

      const createUserResponse2 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse2.statusCode).toBe(400);
      const body = createUserResponse2.body;
      expect(typeof body).toBe('object');
      const { message: createUserResponse2Message, args: createUserResponse2Args } = body.data as BadRequestException;
      expect(createUserResponse2Message).toBe(errorKeys.users.User_Already_Exists);
      expect(createUserResponse2Args).toEqual({ email: requestData.email, phone: requestData.phone });

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    test('when exist user with same email and phone (different letters size)', async () => {
      const requestData = generateValidUser();
      const createUserResponse1 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user, message: createMessage }: CreateUserResponseDto = createUserResponse1.body;
      expect(createMessage).toBe(events.users.userCreated);

      requestData.email = requestData.email.toUpperCase();
      const createUserResponse2 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse2.statusCode).toBe(400);
      const body = createUserResponse2.body;
      expect(typeof body).toBe('object');
      const { message: createUserResponse2Message, args: createUserResponse2Args } = body.data as BadRequestException;
      expect(createUserResponse2Message).toBe(errorKeys.users.User_Already_Exists);
      expect(createUserResponse2Args).toEqual({ email: requestData.email, phone: requestData.phone });

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(requestData);
      expect(createUserResponse.statusCode).toBe(401);
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      expect(sendWelcomeEmailSpy).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const requestData = generateValidUser();
      const newUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(generateValidUser())
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(createUserResponse.statusCode).toBe(403);
      expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    test('when user have all permissions expect AddUser', async () => {
      const requestData = generateValidUser();
      const newUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermission);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermission.AddUser) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(generateValidUser())
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(createUserResponse.statusCode).toBe(403);
      expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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
              testEventHandlers.onPermissionAdded,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const requestData = generateValidUser();
      const response = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(response.statusCode).toBe(401);
      const body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      expect(sendWelcomeEmailSpy).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when try to use token from user that not exists', async () => {
      const userBob = generateValidUser();

      const createBobResponse = await request(app.getServer()).post(userRoute.path).send(userBob).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createBobResponse.statusCode).toBe(201);
      const { data: bobDto, message: bobCreateMessage }: CreateUserResponseDto = createBobResponse.body;
      expect(bobDto?.id).toBeDefined();
      expect(bobCreateMessage).toBe(events.users.userCreated);

      const activateBobResponse = await request(app.getServer())
        .post(userRoute.path + '/' + bobDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateBobResponse.statusCode).toBe(200);

      const bobAccessToken = (await loginAs(app, { email: bobDto.email, password: userBob.password } satisfies LoginDto))?.accessToken;

      const deleteBobResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + bobDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteBobResponse.statusCode).toBe(200);

      const createUserUsingBobAccessTokenResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(generateValidUser())
        .set('Authorization', `Bearer ${bobAccessToken}`);
      expect(createUserUsingBobAccessTokenResponse.statusCode).toBe(401);
      expect(createUserUsingBobAccessTokenResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createUserUsingBobAccessTokenResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as UnauthorizedException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Wrong_Authentication_Token);
      expect(loginArgs).toBeUndefined();

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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
