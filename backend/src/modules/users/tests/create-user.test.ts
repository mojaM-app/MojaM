/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { VALIDATOR_SETTINGS } from '@config';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUserWithPassword, generateValidUserWithPin, loginAs } from '@helpers/user-tests.helpers';
import { AccountTryingToLogInDto, AuthRoute, IGetAccountBeforeLogInResultDto, LoginDto } from '@modules/auth';
import { EmailService } from '@modules/notifications';
import { PermissionsRoute, SystemPermissions } from '@modules/permissions';
import {
  CreateUserDto,
  CreateUserResponseDto,
  GetUserDetailsResponseDto,
  GetUserProfileResponseDto,
  IUserDto,
  UserDetailsRoute,
  UserRoute,
} from '@modules/users';
import { isGuid, isNumber } from '@utils';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { App } from './../../../app';

describe('POST /user', () => {
  const userRoute = new UserRoute();
  const userDetailsRoute = new UserDetailsRoute();
  const permissionsRoute = new PermissionsRoute();
  const authRoute = new AuthRoute();
  const app = new App();
  let mockSendMail: any;
  let adminAccessToken: string | undefined;
  let sendWelcomeEmailSpy: any;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute, userDetailsRoute]);
    const { email, passcode } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, passcode } satisfies LoginDto))?.accessToken;

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
      const requestData = generateValidUserWithPassword();
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
      expect(user.hasOwnProperty('pin')).toBe(false);
      expect(user.hasOwnProperty('passcode')).toBe(false);
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

    test('when try to create user without passcode (passcode=undefined) and user has permission', async () => {
      const requestData = generateValidUserWithPassword();
      delete requestData.passcode;
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
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(createMessage).toBe(events.users.userCreated);

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body;
      expect(body.data).toStrictEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

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

    test('when try to create user with empty passcode (passcode will be set as null) and user has permission', async () => {
      const requestData = generateValidUserWithPassword();
      requestData.passcode = '';
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
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(createMessage).toBe(events.users.userCreated);

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body;
      expect(body.data).toStrictEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

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

    test('when try to create user with passcode=null and user has permission', async () => {
      const requestData = generateValidUserWithPassword();
      requestData.passcode = null;
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
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(createMessage).toBe(events.users.userCreated);

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body;
      expect(body.data).toStrictEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

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

    test('when data are valid (with completed name) and user has permission', async () => {
      const requestData = generateValidUserWithPassword();
      requestData.firstName = 'John';
      requestData.lastName = 'Doe';
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
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(user.hasOwnProperty('password')).toBe(false);
      expect(user.hasOwnProperty('pin')).toBe(false);
      expect(user.hasOwnProperty('passcode')).toBe(false);
      expect(user).toEqual({ id: user.id, email: user.email, phone: user.phone } satisfies IUserDto);
      expect(createMessage).toBe(events.users.userCreated);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(200);
      body = getUserDetailsResponse.body;
      const { data: userDetails }: GetUserProfileResponseDto = body;
      expect(userDetails!.firstName).toBe(requestData.firstName);
      expect(userDetails!.lastName).toBe(requestData.lastName);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted, testEventHandlers.onUserDetailsRetrieved].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDetailsRetrieved).toHaveBeenCalledTimes(1);
    });

    test('when data are valid (with completed name that contains white-spaces) and user has permission', async () => {
      const requestData = generateValidUserWithPassword();
      requestData.firstName = 'John ';
      requestData.lastName = ' Doe  ';
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
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(user.hasOwnProperty('password')).toBe(false);
      expect(user.hasOwnProperty('pin')).toBe(false);
      expect(user.hasOwnProperty('passcode')).toBe(false);
      expect(user).toEqual({ id: user.id, email: user.email, phone: user.phone } satisfies IUserDto);
      expect(createMessage).toBe(events.users.userCreated);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(200);
      body = getUserDetailsResponse.body;
      const { data: userDetails }: GetUserProfileResponseDto = body;
      expect(userDetails!.firstName).toBe(requestData.firstName.trim());
      expect(userDetails!.lastName).toBe(requestData.lastName.trim());

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted, testEventHandlers.onUserDetailsRetrieved].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDetailsRetrieved).toHaveBeenCalledTimes(1);
    });

    test('when data are valid (with empty name) and user has permission', async () => {
      const requestData = generateValidUserWithPassword();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send({
          ...requestData,
          firstName: '',
          lastName: '',
        })
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(user.hasOwnProperty('password')).toBe(false);
      expect(user.hasOwnProperty('pin')).toBe(false);
      expect(user.hasOwnProperty('passcode')).toBe(false);
      expect(user).toEqual({ id: user.id, email: user.email, phone: user.phone } satisfies IUserDto);
      expect(createMessage).toBe(events.users.userCreated);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(200);
      body = getUserDetailsResponse.body;
      const { data: userDetails }: GetUserDetailsResponseDto = body;
      expect(userDetails!.firstName).toBeNull();
      expect(userDetails!.lastName).toBeNull();

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted, testEventHandlers.onUserDetailsRetrieved].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDetailsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when data are valid (with white-space name) and user has permission', async () => {
      const requestData = generateValidUserWithPassword();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send({
          ...requestData,
          firstName: ' ',
          lastName: ' ',
        })
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(user.hasOwnProperty('password')).toBe(false);
      expect(user.hasOwnProperty('pin')).toBe(false);
      expect(user.hasOwnProperty('passcode')).toBe(false);
      expect(user).toEqual({ id: user.id, email: user.email, phone: user.phone } satisfies IUserDto);
      expect(createMessage).toBe(events.users.userCreated);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(200);
      body = getUserDetailsResponse.body;
      const { data: userDetails }: GetUserDetailsResponseDto = body;
      expect(userDetails!.firstName).toBeNull();
      expect(userDetails!.lastName).toBeNull();

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted, testEventHandlers.onUserDetailsRetrieved].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDetailsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when try to create user without pin (pin=undefined) and user has permission', async () => {
      const requestData = generateValidUserWithPin();
      delete requestData.passcode;
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
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(createMessage).toBe(events.users.userCreated);

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body;
      expect(body.data).toStrictEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

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

    test('when try to create user with empty pin (pin will be set as null) and user has permission', async () => {
      const requestData = generateValidUserWithPin();
      requestData.passcode = '';
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
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(createMessage).toBe(events.users.userCreated);

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body;
      expect(body.data).toStrictEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

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

    test('when try to create user with pin=null and user has permission', async () => {
      const requestData = generateValidUserWithPin();
      requestData.passcode = null;
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
      expect(isGuid(user.id)).toBe(true);
      expect(user?.email).toBeDefined();
      expect(user?.phone).toBeDefined();
      expect(user.hasOwnProperty('uuid')).toBe(false);
      expect(createMessage).toBe(events.users.userCreated);

      const getAccountBeforeLogInResponse = await request(app.getServer())
        .post(authRoute.getAccountBeforeLogInPath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body;
      expect(body.data).toStrictEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

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
    test('when passcode is invalid', async () => {
      const model = { email: 'email@domain.com', phone: '123456789' } satisfies CreateUserDto;
      const bodyData = [
        { ...model, passcode: ' ' } satisfies CreateUserDto,
        { ...model, passcode: 'invalid password/pin' } satisfies CreateUserDto,
        { ...model, passcode: true as any } satisfies CreateUserDto,
        { ...model, passcode: [] as any } satisfies CreateUserDto,
        { ...model, passcode: [generateRandomPassword()] as any } satisfies CreateUserDto,
        { ...model, passcode: {} as any } satisfies CreateUserDto,
        { ...model, passcode: generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH - 1) } satisfies CreateUserDto,
        { ...model, passcode: generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH + 1) } satisfies CreateUserDto,
        { ...model, passcode: 1234 as any } satisfies CreateUserDto,
        { ...model, passcode: [generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH)] as any } satisfies CreateUserDto,
      ];

      for (const requestData of bodyData) {
        const createUserResponse = await request(app.getServer())
          .post(userRoute.path)
          .send(requestData)
          .set('Authorization', `Bearer ${adminAccessToken}`);
        expect(createUserResponse.statusCode).toBe(400);
        const body = createUserResponse.body;
        expect(typeof body).toBe('object');
        const { message: createUserResponseMessage } = body.data as BadRequestException;
        const errors = createUserResponseMessage.split(',');
        expect(errors.filter(x => !x.includes('Passcode')).length).toBe(0);

        // checking events running via eventDispatcher
        Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });

        expect(sendWelcomeEmailSpy).not.toHaveBeenCalled();
        expect(mockSendMail).not.toHaveBeenCalled();
      }
    });

    test('when email is invalid', async () => {
      const model = { passcode: 'strongPassword1@', phone: '123456789', email: generateRandomEmail() } satisfies CreateUserDto;
      const bodyData = [
        { ...model, email: null as any } satisfies CreateUserDto,
        { ...model, email: undefined as any } satisfies CreateUserDto,
        { ...model, email: '' } satisfies CreateUserDto,
        { ...model, email: 'invalid email' } satisfies CreateUserDto,
        { ...model, email: 123 as any } satisfies CreateUserDto,
        { ...model, email: true as any } satisfies CreateUserDto,
        { ...model, email: [] as any } satisfies CreateUserDto,
        { ...model, email: {} as any } satisfies CreateUserDto,
      ];

      for (const requestData of bodyData) {
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
      }
    });

    test('when phone is invalid', async () => {
      const model = { email: 'email@domain.com', passcode: 'strongPassword1@', phone: generateRandomNumber(7) } satisfies CreateUserDto;
      const bodyData = [
        { ...model, phone: null as any } satisfies CreateUserDto,
        { ...model, phone: undefined as any } satisfies CreateUserDto,
        { ...model, phone: '' } satisfies CreateUserDto,
        { ...model, phone: 'invalid phone' } satisfies CreateUserDto,
        { ...model, phone: 123 as any } satisfies CreateUserDto,
        { ...model, phone: true as any } satisfies CreateUserDto,
        { ...model, phone: [] as any } satisfies CreateUserDto,
        { ...model, phone: {} as any } satisfies CreateUserDto,
      ];

      for (const requestData of bodyData) {
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
      }
    });

    test('when exist user with same email and phone', async () => {
      const requestData = generateValidUserWithPassword();
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
      const requestData = generateValidUserWithPassword();
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
      const requestData = generateValidUserWithPassword();
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
      const requestData = generateValidUserWithPassword();
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

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(generateValidUserWithPassword())
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
      const requestData = generateValidUserWithPassword();
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

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.AddUser) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(generateValidUserWithPassword())
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
      const requestData = generateValidUserWithPassword();
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
      const userBob = generateValidUserWithPassword();

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

      const bobAccessToken = (await loginAs(app, { email: bobDto.email, passcode: userBob.passcode } satisfies LoginDto))?.accessToken;

      const deleteBobResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + bobDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteBobResponse.statusCode).toBe(200);

      const createUserUsingBobAccessTokenResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(generateValidUserWithPassword())
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
