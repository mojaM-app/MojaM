import { events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { ActivateUserResponseDto, CreateUserResponseDto, DeactivateUserResponseDto, UserRoute } from '@modules/users';
import { getAdminLoginData, isNumber } from '@utils';
import { testUtils } from '@helpers';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { TestApp } from './../../../helpers/tests.utils';
import { SystemPermissions } from '@core';

describe('POST /user/:id/deactivate', () => {
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testUtils.getTestApp([userRoute, permissionsRoute]);
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await testUtils.loginAs(app, { email, passcode } satisfies LoginDto))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('POST should respond with a status code of 200', () => {
    test('when data are valid and user has permission', async () => {
      const user = testUtils.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateUserResponse.statusCode).toBe(200);
      expect(deactivateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deactivateUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: result, message }: DeactivateUserResponseDto = body;
      expect(message).toBe(events.users.userDeactivated);
      expect(result).toBe(true);

      const deleteUserResponse = await request(app!.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeactivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when data are valid, user has permission and deactivatedUser is not active', async () => {
      const user = testUtils.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateUserResponse1 = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateUserResponse1.statusCode).toBe(200);
      expect(deactivateUserResponse1.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = deactivateUserResponse1.body;
      expect(typeof body).toBe('object');
      const { data: result1, message: message1 }: DeactivateUserResponseDto = body;
      expect(message1).toBe(events.users.userDeactivated);
      expect(result1).toBe(true);

      const deactivateUserResponse2 = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateUserResponse2.statusCode).toBe(200);
      expect(deactivateUserResponse2.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deactivateUserResponse2.body;
      expect(typeof body).toBe('object');
      const { data: result2, message: message2 }: DeactivateUserResponseDto = body;
      expect(message2).toBe(events.users.userDeactivated);
      expect(result2).toBe(true);

      const deleteUserResponse = await request(app!.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeactivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when data are valid, user has permission and deactivatedUser is active', async () => {
      const user = testUtils.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);
      expect(activateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = activateUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: result1, message: message1 }: ActivateUserResponseDto = body;
      expect(message1).toBe(events.users.userActivated);
      expect(result1).toBe(true);

      const deactivateUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateUserResponse.statusCode).toBe(200);
      expect(deactivateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deactivateUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: result2, message: message2 }: DeactivateUserResponseDto = body;
      expect(message2).toBe(events.users.userDeactivated);
      expect(result2).toBe(true);

      const deleteUserResponse = await request(app!.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeactivated,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeactivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const deactivateUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + userId + '/' + userRoute.deactivatePath)
        .send();
      expect(deactivateUserResponse.statusCode).toBe(401);
      const body = deactivateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const requestData = testUtils.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testUtils.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))
        ?.accessToken;
      const deactivateUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(deactivateUserResponse.statusCode).toBe(403);
      expect(deactivateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deactivateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app!.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

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
    });

    test('when user have all permissions expect DeactivateUser', async () => {
      const requestData = testUtils.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.DeactivateUser) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await testUtils.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))
        ?.accessToken;

      const deactivateUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(deactivateUserResponse.statusCode).toBe(403);
      expect(deactivateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deactivateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app!.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

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
    });
  });

  describe('POST should respond with a status code of 400', () => {
    test('when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const deactivateResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + userId + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateResponse.statusCode).toBe(400);
      expect(deactivateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deactivateResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: deactivateMessage, args: deactivateArgs } = data;
      expect(deactivateMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(deactivateArgs).toEqual({ id: userId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 404', () => {
    test('when user Id is not GUID', async () => {
      const deactivateResponse = await request(app!.getServer())
        .post(userRoute.path + '/invalid-guid/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deactivateResponse.statusCode).toBe(404);
      expect(deactivateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deactivateResponse.body;
      expect(typeof body).toBe('object');
      const { message: deactivateMessage }: { message: string } = body;
      expect(deactivateMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const deactivateResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + userId + '/' + userRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(deactivateResponse.statusCode).toBe(401);
      const body = deactivateResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  afterAll(async () => {
    await testUtils.closeTestApp();
    jest.resetAllMocks();
  });
});
