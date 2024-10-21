/* eslint-disable no-prototype-builtins */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import { CreateUserResponseDto, DeleteUserResponseDto, GetUserListResponseDto, UserListRetrievedEvent, UserListRoute, UserRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { isNumber } from '@utils';
import { registerTestEventHandlers, testEventHandlers } from '@utils/tests-events.utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import request from 'supertest';

describe('GET/user-list', () => {
  const userRouter = new UserRoute();
  const userListRouter = new UserListRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRouter, userListRouter, permissionsRoute]);
    const { email: login, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email: login, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('GET should respond with a status code of 200', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when data are valid and user has permission', async () => {
      const newUser = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRouter.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const getUserListResponse = await request(app.getServer())
        .get(userListRouter.path)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserListResponse.statusCode).toBe(200);
      expect(getUserListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserListResponse.body;
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

      const deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserListRetrieved, testEventHandlers.onUserDeleted].includes(eventHandler),
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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is not set', async () => {
      const getUserListResponse = await request(app.getServer())
        .get(userListRouter.path)
        .send();
      expect(getUserListResponse.statusCode).toBe(401);
      const body = getUserListResponse.body;
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
        .post(userRouter.path)
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
        .post(userRouter.path + '/' + newUserDto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const getUserListResponse = await request(app.getServer())
        .get(userListRouter.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserListResponse.statusCode).toBe(403);
      expect(getUserListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserUuid }: DeleteUserResponseDto = body;
      expect(deletedUserUuid).toBe(newUserDto.id);

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
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRouter.path)
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
        .post(userRouter.path + '/' + newUserDto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermission);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermission.PreviewUserList) {
            const path = permissionsRoute.path + '/' + newUserDto.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const getUserListResponse = await request(app.getServer())
        .get(userListRouter.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserListResponse.statusCode).toBe(403);
      expect(getUserListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserListResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserUuid }: DeleteUserResponseDto = body;
      expect(deletedUserUuid).toBe(newUserDto.id);

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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is invalid', async () => {
      const getUserListResponse = await request(app.getServer())
        .get(userListRouter.path)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(getUserListResponse.statusCode).toBe(401);
      const body = getUserListResponse.body;
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
