import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import { ActivateUserResponseDto, CreateUserResponseDto, DeleteUserResponseDto, UserActivatedEvent, UserRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { isNumber } from '@utils';
import { registerTestEventHandlers, testEventHandlers } from '@utils/tests-events.utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('POST /user/:id/activate', () => {
  const userRouter = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRouter, permissionsRoute]);
    const { email: login, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email: login, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('POST should respond with a status code of 200', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('when data are valid and user has permission', async () => {
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRouter.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUserDto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);
      expect(activateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body: ActivateUserResponseDto = activateUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: result, message }: ActivateUserResponseDto = body;
      expect(message).toBe(events.users.userActivated);
      expect(result).toBe(true);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUserDto.id)
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
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledWith(new UserActivatedEvent(newUserDto, 1));
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when data are valid, user has permission and activatedUser is active', async () => {
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRouter.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse1 = await request(app.getServer())
        .post(userRouter.path + '/' + newUserDto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse1.statusCode).toBe(200);
      expect(activateUserResponse1.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body: ActivateUserResponseDto = activateUserResponse1.body;
      expect(typeof body).toBe('object');
      const { data: result1, message: message1 }: ActivateUserResponseDto = body;
      expect(message1).toBe(events.users.userActivated);
      expect(result1).toBe(true);

      const activateUserResponse2 = await request(app.getServer())
        .post(userRouter.path + '/' + newUserDto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse2.statusCode).toBe(200);
      expect(activateUserResponse2.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = activateUserResponse2.body;
      expect(typeof body).toBe('object');
      const { data: result2, message: message2 }: ActivateUserResponseDto = body;
      expect(message2).toBe(events.users.userActivated);
      expect(result2).toBe(true);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUserDto.id)
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
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRouter.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUserDto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);
      expect(activateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body: ActivateUserResponseDto = activateUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: result2, message: message2 }: ActivateUserResponseDto = body;
      expect(message2).toBe(events.users.userActivated);
      expect(result2).toBe(true);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUserDto.id)
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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const activateUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + userId + '/' + userRouter.activatePath)
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
      const requestData = generateValidUser();

      const createUserResponse = await request(app.getServer())
        .post(userRouter.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + user.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const activateUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + user.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(403);
      expect(activateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = activateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);
      expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserUuid }: DeleteUserResponseDto = body;
      expect(deletedUserUuid).toBe(user.id);

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
      const requestData = generateValidUser();

      const createUserResponse = await request(app.getServer())
        .post(userRouter.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + user.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermission);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermission.ActivateUser) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const activateUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + user.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(403);
      expect(activateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = activateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);
      expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserUuid }: DeleteUserResponseDto = body;
      expect(deletedUserUuid).toBe(user.id);

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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const activateResponse = await request(app.getServer())
        .post(userRouter.path + '/' + userId + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(400);
      expect(activateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = activateResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: activateMessage, args: activateArgs }: { message: string; args: string[] } = data;
      expect(activateMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(activateArgs.length).toBe(1);
      expect(activateArgs[0]).toBe(userId);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 404', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when user Id is not GUID', async () => {
      const activateResponse = await request(app.getServer())
        .post(userRouter.path + '/invalid-guid/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateResponse.statusCode).toBe(404);
      expect(activateResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { message: activateMessage }: { message: string } = body;
      expect(activateMessage).toBe(errorKeys.general.Page_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 401', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const activateResponse = await request(app.getServer())
        .post(userRouter.path + '/' + userId + '/' + userRouter.activatePath)
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
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
