import { events, ILoginModel, SystemPermissions } from '@core';
import { errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { userTestHelpers } from '@modules/users';
import { getAdminLoginData } from '@utils';
import { Container } from 'typedi';
import { testEventHandlers } from '../../../helpers/event-handler-tests.helper';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateUserResponseDto } from '../dtos/create-user.dto';
import { GetUserListResponseDto } from '../dtos/get-user-list.dto';
import { UserListRetrievedEvent } from '../events/user-list-retrieved-event';
import { UserListService } from '../services/user-list.service';

describe('GET/user-list', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await app.auth.loginAs({ email, passcode } satisfies ILoginModel))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('GET should respond with a status code of 200', () => {
    test('when data are valid and user has permission', async () => {
      const newUser = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const getListResponse = await app!.userList.get(adminAccessToken);
      expect(getListResponse.statusCode).toBe(200);
      expect(getListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getListResponse.body;
      expect(typeof body).toBe('object');
      const { data: gridPage, message: getUserListMessage }: GetUserListResponseDto = body;
      expect(getUserListMessage).toBe(events.users.userListRetrieved);
      expect(gridPage).toBeDefined();
      expect(typeof gridPage).toBe('object');
      expect(gridPage.totalCount).toBeDefined();
      expect(typeof gridPage.totalCount).toBe('number');
      expect(gridPage.totalCount).toBeGreaterThan(0);
      expect(gridPage.items).toBeDefined();
      expect(Array.isArray(gridPage.items)).toBe(true);
      expect(gridPage.items.length).toBeGreaterThan(0);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserListRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserListRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserListRetrieved).toHaveBeenCalledWith(new UserListRetrievedEvent(1));
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should respond with a status code of 403', () => {
    test('when user has no permission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getListResponse = await app!.userList.get(newUserAccessToken);
      expect(getListResponse.statusCode).toBe(403);
      expect(getListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
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
      expect(testEventHandlers.onUserListRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when user have all permissions expect PreviewUserList', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(newUserDto.id, adminAccessToken, [
        SystemPermissions.PreviewUserList,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getListResponse = await app!.userList.get(newUserAccessToken);
      expect(getListResponse.statusCode).toBe(403);
      expect(getListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
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
      expect(testEventHandlers.onUserListRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('GET should respond with a status code of 401', () => {
    test('when token is not set', async () => {
      const getListResponse = await app!.userList.get();
      expect(getListResponse.statusCode).toBe(401);
      const body = getListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when token is invalid', async () => {
      const getListResponse = await app!.userList.get(`Bearer invalid_token_${adminAccessToken}`);
      expect(getListResponse.statusCode).toBe(401);
      const body = getListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should handle errors', () => {
    it('when service throws an error', async () => {
      const userListService = Container.get(UserListService);
      const mockGet = jest.spyOn(userListService, 'get').mockRejectedValue(new Error('Service error'));
      const getUserListResponse = await app!.userList.get(adminAccessToken);
      expect(getUserListResponse.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
