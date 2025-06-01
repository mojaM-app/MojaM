import { ILoginModel, IUserDto, SystemPermissions } from '@core';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, UserRoute, userTestHelpers } from '@modules/users';
import { getAdminLoginData, isNumber } from '@utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { AddPermissionsResponseDto } from '../dtos/add-permission.dto';
import { PermissionAddedEvent } from '../events/permission-added-event';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { TestApp } from './../../../helpers/tests.utils';

describe('POST /permissions', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;
  let userLoggedIn: IUserDto;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    const loginResult = await testHelpers.loginAs(app, { email, passcode } satisfies ILoginModel);
    adminAccessToken = loginResult?.accessToken;
    userLoggedIn = loginResult!;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('POST should respond with a status code of 404', () => {
    it('POST should respond with a status code of 404 when userId is missing', async () => {
      const path = PermissionsRoute.path + '/' + SystemPermissions.ActivateUser.toString();
      const response = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST should respond with a status code of 404 when userId is invalid', async () => {
      const path = PermissionsRoute.path + '/invalid-user-id/' + SystemPermissions.ActivateUser.toString();
      const response = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST should respond with a status code of 404 when permissionId is missing', async () => {
      const path = PermissionsRoute.path + '/' + userLoggedIn.id;
      const response = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST should respond with a status code of 404 when permissionId is invalid', async () => {
      const path = PermissionsRoute.path + '/' + userLoggedIn.id + '/invalid-permission-id';
      const response = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST should respond with a status code of 404 when userId and permissionId are missing', async () => {
      const path = PermissionsRoute.path;
      const response = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST should respond with a status code of 404 when userId and permissionId are invalid', async () => {
      const path = PermissionsRoute.path + '/invalid-user-id/invalid-permission-id';
      const response = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST should respond with a status code of 400', () => {
    it('POST should respond with a status code of 400 when user not exist', async () => {
      const path = PermissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermissions.ActivateUser.toString();
      const response = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as AddPermissionsResponseDto;
      expect(typeof body).toBe('object');
      const data = body.data;
      expect(data).toBe(false);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('POST should respond with a status code of 400 when permission not exist', async () => {
      const newUser = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();

      const deleteResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      const path = PermissionsRoute.path + '/' + newUserDto.id + '/' + (SystemPermissions.PreviewUserList - 1).toString();
      const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(400);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = addPermissionResponse.body as AddPermissionsResponseDto;
      expect(typeof body).toBe('object');
      const data = body.data;
      expect(data).toBe(false);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserRetrieved, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });
  });

  describe('POST should respond with a status code of 401', () => {
    it('when token is invalid', async () => {
      const path = PermissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermissions.PreviewUserList.toString();
      const addPermissionResponse = await request(app!.getServer())
        .post(path)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(401);
      const body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 403', () => {
    it('when token is not set', async () => {
      const path = PermissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermissions.PreviewUserList.toString();
      const addPermissionResponse = await request(app!.getServer()).post(path).send();
      expect(addPermissionResponse.statusCode).toBe(401);
      const body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user has no permission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body: any = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + user.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies ILoginModel))
        ?.accessToken;

      const path = PermissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(403);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
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

    it('when user have all permissions expect AddPermission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body: any = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + user.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.AddPermission) {
            const path = PermissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies ILoginModel))
        ?.accessToken;

      const path = PermissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(403);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
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
    });
  });

  describe('POST should respond with a status code of 200', () => {
    it('when user have permissions to add systemPermission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + user.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      let path = PermissionsRoute.path + '/' + user.id + '/' + SystemPermissions.AddPermission.toString();
      let addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
      expect(addPermission1Result).toBe(true);
      expect(addPermission1Message).toBe(events.permissions.permissionAdded);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies ILoginModel))
        ?.accessToken;

      path = PermissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
      expect(addPermission2Result).toBe(true);
      expect(addPermission2Message).toBe(events.permissions.permissionAdded);

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
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserActivated,
              testEventHandlers.onPermissionAdded,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });

    it('when user have permissions to add systemPermission and the user to whom we grant permissions already has this permission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const path = PermissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
      expect(addPermissionResult).toBe(true);
      expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

      const addPermissionAgainResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionAgainResponse.statusCode).toBe(201);
      expect(addPermissionAgainResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionAgainResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermissionAgainResult, message: addPermissionAgainMessage }: AddPermissionsResponseDto = body;
      expect(addPermissionAgainResult).toBe(true);
      expect(addPermissionAgainMessage).toBe(events.permissions.permissionAdded);

      const deleteUserResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted, testEventHandlers.onPermissionAdded].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalledWith(new PermissionAddedEvent(user.id, SystemPermissions.PreviewUserList, 1));
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
