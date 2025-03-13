/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermissions } from '@modules/permissions';
import {
  CreateUserResponseDto,
  GetUserDetailsResponseDto,
  IUserDetailsDto,
  UserDetailsRetrievedEvent,
  UserDetailsRoute,
  UserRoute,
} from '@modules/users';
import { isGuid, isNumber } from '@utils';
import { generateRandomDate, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import nodemailer from 'nodemailer';
import request from 'supertest';

describe('GET/user-details/:id', () => {
  const userDetailsRoute = new UserDetailsRoute();
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let adminAccessToken: string | undefined;
  let mockSendMail: any;

  beforeAll(async () => {
    await app.initialize([userDetailsRoute, userRoute, permissionsRoute]);
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

  describe('GET should respond with a status code of 200', () => {
    test('when data are valid and user has permission', async () => {
      const newUser = {
        ...generateValidUser(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(newUser).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(200);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserDetailsResponse.body;
      expect(typeof body).toBe('object');
      const { data: userDetails, message: getMessage }: GetUserDetailsResponseDto = body;
      expect(getMessage).toBe(events.users.userDetailsRetrieved);
      expect(userDetails).toBeDefined();
      expect(userDetails!.id).toBeDefined();
      expect(isGuid(userDetails!.id)).toBe(true);
      expect(userDetails!.id).toBe(newUserDto.id);
      expect(userDetails!.hasOwnProperty('uuid')).toBe(false);
      expect(userDetails!.email).toBeDefined();
      expect(userDetails!.email).toBe(newUserDto.email);
      expect(userDetails!.phone).toBeDefined();
      expect(userDetails!.phone).toBe(newUserDto.phone);
      userDetails!.joiningDate = new Date(userDetails!.joiningDate!);
      expect(userDetails!.joiningDate).toEqual(newUser.joiningDate);
      expect(userDetails!.isActive).toBe(false);
      expect(userDetails!.isLockedOut).toBe(false);
      expect(userDetails!.permissionCount).toBe(0);
      expect(userDetails!.firstName).toBeDefined();
      expect(userDetails!.firstName).toBe(newUser.firstName);
      expect(userDetails!.lastName).toBeDefined();
      expect(userDetails!.lastName).toBe(newUser.lastName);
      expect(userDetails!.lastLoginAt).toBeNull();

      expect(userDetails).toStrictEqual({
        id: newUserDto.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        joiningDate: newUser.joiningDate,
        email: newUserDto.email,
        phone: newUserDto.phone,
        lastLoginAt: null,
        isLockedOut: false,
        permissionCount: 0,
        isActive: false,
      } satisfies IUserDetailsDto);

      expect(userDetails).toEqual({
        id: newUserDto.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        joiningDate: newUser.joiningDate,
        email: newUserDto.email,
        phone: newUserDto.phone,
        lastLoginAt: null,
        isLockedOut: false,
        permissionCount: 0,
        isActive: false,
      } satisfies IUserDetailsDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + userDetails!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDetailsRetrieved, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDetailsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDetailsRetrieved).toHaveBeenCalledWith(new UserDetailsRetrievedEvent(userDetails!, 1));
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + userId)
        .send();
      expect(getUserDetailsResponse.statusCode).toBe(401);
      const body = getUserDetailsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(403);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserDetailsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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
      expect(testEventHandlers.onUserDetailsRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when user have all permissions expect PreviewUserDetails', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.PreviewUserDetails) {
            const path = permissionsRoute.path + '/' + newUserDto.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(403);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserDetailsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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
      expect(testEventHandlers.onUserDetailsRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('GET should respond with a status code of 400', () => {
    test('GET should respond with a status code of 400 when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + userId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(400);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserDetailsResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: getMessage, args: getArgs } = data;
      expect(getMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(getArgs).toEqual({ id: userId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should respond with a status code of 404', () => {
    test('GET should respond with a status code of 404 when user Id is not GUID', async () => {
      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/invalid-guid')
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(404);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserDetailsResponse.body;
      expect(typeof body).toBe('object');
      const { message: deleteMessage }: { message: string } = body;
      expect(deleteMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const getUserDetailsResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + userId)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(401);
      const body = getUserDetailsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

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
