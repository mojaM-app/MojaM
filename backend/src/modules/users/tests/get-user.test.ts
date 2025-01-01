/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import { CreateUserResponseDto, DeleteUserResponseDto, UserRetrievedEvent, UserRoute } from '@modules/users';
import { isGuid, isNumber } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { GetUserResponseDto } from '../dtos/get-user.dto';

describe('GET/user/:id', () => {
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRoute, userRoute, permissionsRoute]);
    const { email, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('GET should respond with a status code of 200', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when data are valid and user has permission', async () => {
      const newUser = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(newUser).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserResponse.statusCode).toBe(200);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: getMessage }: GetUserResponseDto = body;
      expect(getMessage).toBe(events.users.userRetrieved);
      expect(user).toBeDefined();
      expect(user!.id).toBeDefined();
      expect(isGuid(user!.id)).toBe(true);
      expect(user!.id).toBe(newUserDto.id);
      expect(user?.email).toBeDefined();
      expect(user!.email).toBe(newUserDto.email);
      expect(user?.phone).toBeDefined();
      expect(user!.phone).toBe(newUserDto.phone);
      expect(user!.hasOwnProperty('uuid')).toBe(false);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserRetrieved, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserRetrieved).toHaveBeenCalledWith(new UserRetrievedEvent(user!, 1));
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should respond with a status code of 403', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + userId)
        .send();
      expect(getUserResponse.statusCode).toBe(401);
      const body = getUserResponse.body;
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

      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserResponse.statusCode).toBe(403);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
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
      expect(testEventHandlers.onUserRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when user have all permissions expect EditUser', async () => {
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

      const systemPermissions = Object.values(SystemPermission);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermission.EditUser) {
            const path = permissionsRoute.path + '/' + newUserDto.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserResponse.statusCode).toBe(403);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
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
      expect(testEventHandlers.onUserRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('GET should respond with a status code of 400', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('GET should respond with a status code of 400 when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + userId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserResponse.statusCode).toBe(400);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('GET should respond with a status code of 404 when user Id is not GUID', async () => {
      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/invalid-guid')
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserResponse.statusCode).toBe(404);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserResponse.body;
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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + userId)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(getUserResponse.statusCode).toBe(401);
      const body = getUserResponse.body;
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