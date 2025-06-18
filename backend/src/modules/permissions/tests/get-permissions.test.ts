import { events, ILoginModel, RouteConstants, SystemPermissions } from '@core';
import { errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { getAdminLoginData, isNumber } from '@utils';
import request from 'supertest';
import { GetPermissionsResponseDto } from '../dtos/get-permissions.dto';
import { PermissionsRoute } from '../routes/permissions.routes';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { TestApp } from './../../../helpers/tests.utils';

describe('GET /permissions', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    const loginResult = await testHelpers.loginAs(app, { email, passcode } satisfies ILoginModel);
    adminAccessToken = loginResult?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('POST should respond with a status code of 401', () => {
    it('when token is invalid', async () => {
      const getPermissionsResponse = await request(app!.getServer())
        .get(PermissionsRoute.path)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(getPermissionsResponse.statusCode).toBe(401);
      const body = getPermissionsResponse.body;
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
      const getPermissionsResponse = await request(app!.getServer()).get(PermissionsRoute.path).send();
      expect(getPermissionsResponse.statusCode).toBe(401);
      const body = getPermissionsResponse.body;
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
        .post(RouteConstants.USER_PATH)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body: any = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + user.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies ILoginModel))
        ?.accessToken;

      const getPermissionsResponse = await request(app!.getServer())
        .get(PermissionsRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getPermissionsResponse.statusCode).toBe(403);
      expect(getPermissionsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getPermissionsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + user.id)
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

    it('when user have all permissions expect AddPermission/DeletePermission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body: any = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + user.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.AddPermission && value !== SystemPermissions.DeletePermission) {
            const path = PermissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies ILoginModel))
        ?.accessToken;

      const getPermissionsResponse = await request(app!.getServer())
        .get(PermissionsRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getPermissionsResponse.statusCode).toBe(403);
      expect(getPermissionsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getPermissionsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + user.id)
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
    it('when user have AddPermission permission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + user.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const path = PermissionsRoute.path + '/' + user.id + '/' + SystemPermissions.AddPermission.toString();
      const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies ILoginModel))
        ?.accessToken;

      const getPermissionsResponse = await request(app!.getServer())
        .get(PermissionsRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getPermissionsResponse.statusCode).toBe(200);
      expect(getPermissionsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getPermissionsResponse.body;
      expect(typeof body).toBe('object');
      const { data: getPermissionsResult, message: getPermissionsMessage }: GetPermissionsResponseDto = body;
      expect(Array.isArray(getPermissionsResult)).toBe(true);
      expect(getPermissionsMessage).toBe(events.permissions.permissionsRetrieved);

      const deleteUserResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + user.id)
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
              testEventHandlers.onPermissionsRetrieved,
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
      expect(testEventHandlers.onPermissionsRetrieved).toHaveBeenCalled();
    });

    it('when user have DeletePermission permission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + user.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const path = PermissionsRoute.path + '/' + user.id + '/' + SystemPermissions.DeletePermission.toString();
      const addPermissionResponse = await request(app!.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies ILoginModel))
        ?.accessToken;

      const getPermissionsResponse = await request(app!.getServer())
        .get(PermissionsRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getPermissionsResponse.statusCode).toBe(200);
      expect(getPermissionsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getPermissionsResponse.body;
      expect(typeof body).toBe('object');
      const { data: getPermissionsResult, message: getPermissionsMessage }: GetPermissionsResponseDto = body;
      expect(Array.isArray(getPermissionsResult)).toBe(true);
      expect(getPermissionsMessage).toBe(events.permissions.permissionsRetrieved);

      const deleteUserResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + user.id)
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
              testEventHandlers.onPermissionsRetrieved,
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
      expect(testEventHandlers.onPermissionsRetrieved).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
