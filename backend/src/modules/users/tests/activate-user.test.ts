import { ILoginModel, SystemPermissions } from '@core';
import { events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { PermissionsRoute } from '@modules/permissions';
import { UserRoute, userTestHelpers } from '@modules/users';
import { getAdminLoginData, isNumber } from '@utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { testEventHandlers } from '../../../helpers/event-handler-tests.helper';
import { TestApp } from '../../../helpers/tests.utils';
import { ActivateUserResponseDto } from '../dtos/activate-user.dto';
import { CreateUserResponseDto } from '../dtos/create-user.dto';

describe('POST /user/:id/activate', () => {
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

  describe('POST should respond with a status code of 200', () => {
    it('when data are valid and user has permission', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer()).post(UserRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);
      expect(activateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body: ActivateUserResponseDto = activateUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: result, message }: ActivateUserResponseDto = body;
      expect(message).toBe(events.users.userActivated);
      expect(result).toBe(true);

      const deleteUserResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when data are valid, user has permission and activatedUser is active', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer()).post(UserRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse1 = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse1.statusCode).toBe(200);
      expect(activateUserResponse1.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body: ActivateUserResponseDto = activateUserResponse1.body;
      expect(typeof body).toBe('object');
      const { data: result1, message: message1 }: ActivateUserResponseDto = body;
      expect(message1).toBe(events.users.userActivated);
      expect(result1).toBe(true);

      const activateUserResponse2 = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse2.statusCode).toBe(200);
      expect(activateUserResponse2.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = activateUserResponse2.body;
      expect(typeof body).toBe('object');
      const { data: result2, message: message2 }: ActivateUserResponseDto = body;
      expect(message2).toBe(events.users.userActivated);
      expect(result2).toBe(true);

      const deleteUserResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when data are valid, user has permission and activatedUser is not active', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer()).post(UserRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);
      expect(activateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body: ActivateUserResponseDto = activateUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: result2, message: message2 }: ActivateUserResponseDto = body;
      expect(message2).toBe(events.users.userActivated);
      expect(result2).toBe(true);

      const deleteUserResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });
  });

  describe('POST should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const activateUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + userId + '/' + UserRoute.activatePath)
        .send();
      expect(activateUserResponse.statusCode).toBe(401);
      const body = activateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
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
        .post(UserRoute.path + '/' + user.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies ILoginModel))
        ?.accessToken;

      const activateUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + user.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(403);
      expect(activateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = activateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + user.id)
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

    test('when user have all permissions expect ActivateUser', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
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
        .post(UserRoute.path + '/' + user.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.ActivateUser) {
            const path = PermissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies ILoginModel))
        ?.accessToken;

      const activateUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + user.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(403);
      expect(activateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = activateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + user.id)
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
      const activateResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + userId + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(400);
      expect(activateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = activateResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: activateMessage, args: activateArgs } = data;
      expect(activateMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(activateArgs).toEqual({ id: userId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 404', () => {
    test('when user Id is not GUID', async () => {
      const activateResponse = await request(app!.getServer())
        .post(UserRoute.path + '/invalid-guid/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(404);
      expect(activateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { message: activateMessage }: { message: string } = body;
      expect(activateMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const activateResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + userId + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(401);
      const body = activateResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

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
