import { events, ILoginModel, SystemPermissions } from '@core';
import { errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { getAdminLoginData } from '@utils';
import Container from 'typedi';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { GetPermissionsResponseDto } from '../dtos/get-permissions.dto';
import { PermissionsService } from '../services/permissions.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('GET /permissions', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    const loginResult = await app.auth.loginAs({ email, passcode } satisfies ILoginModel);
    adminAccessToken = loginResult?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('GET should respond with a status code of 401', () => {
    it('when token is invalid', async () => {
      const getPermissionsResponse = await app!.permissions.get(`invalid_token_${adminAccessToken}`);
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

  describe('GET should respond with a status code of 403', () => {
    it('when token is not set', async () => {
      const getPermissionsResponse = await app!.permissions.get();
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

      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body: any = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getPermissionsResponse = await app!.permissions.get(newUserAccessToken);
      expect(getPermissionsResponse.statusCode).toBe(403);
      expect(getPermissionsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getPermissionsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
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

      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body: any = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(user.id, adminAccessToken, [
        SystemPermissions.AddPermission,
        SystemPermissions.DeletePermission,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getPermissionsResponse = await app!.permissions.get(newUserAccessToken);
      expect(getPermissionsResponse.statusCode).toBe(403);
      expect(getPermissionsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getPermissionsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
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

  describe('GET should respond with a status code of 200', () => {
    it('when user have AddPermission permission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionResponse = await app!.permissions.add(
        user.id,
        SystemPermissions.AddPermission,
        adminAccessToken,
      );
      expect(addPermissionResponse.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getPermissionsResponse = await app!.permissions.get(newUserAccessToken);
      expect(getPermissionsResponse.statusCode).toBe(200);
      expect(getPermissionsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getPermissionsResponse.body;
      expect(typeof body).toBe('object');
      const { data: getPermissionsResult, message: getPermissionsMessage }: GetPermissionsResponseDto = body;
      expect(Array.isArray(getPermissionsResult)).toBe(true);
      expect(getPermissionsMessage).toBe(events.permissions.permissionsRetrieved);

      const userWithPermissions = getPermissionsResult.find((item: any) => item.id === user.id);
      expect(userWithPermissions?.permissions).toContain(SystemPermissions.AddPermission.toString());

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
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

      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionResponse = await app!.permissions.add(
        user.id,
        SystemPermissions.DeletePermission,
        adminAccessToken,
      );
      expect(addPermissionResponse.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getPermissionsResponse = await app!.permissions.get(newUserAccessToken);
      expect(getPermissionsResponse.statusCode).toBe(200);
      expect(getPermissionsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getPermissionsResponse.body;
      expect(typeof body).toBe('object');
      const { data: getPermissionsResult, message: getPermissionsMessage }: GetPermissionsResponseDto = body;
      expect(Array.isArray(getPermissionsResult)).toBe(true);
      expect(getPermissionsMessage).toBe(events.permissions.permissionsRetrieved);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
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

  describe('GET should handle errors', () => {
    it('when service throws an error', async () => {
      const permissionsService = Container.get(PermissionsService);
      const mockGet = jest.spyOn(permissionsService, 'get').mockRejectedValue(new Error('Service error'));
      const response = await app!.permissions.get(adminAccessToken);
      expect(response.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
