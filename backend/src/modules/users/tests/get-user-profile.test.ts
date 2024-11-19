/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import {
  CreateUserResponseDto,
  DeleteUserResponseDto,
  GetUserProfileResponseDto,
  UserProfileRetrievedEvent,
  UserProfileRoute,
  UserRoute,
} from '@modules/users';
import { isGuid, isNumber } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('GET/user/:id', () => {
  const userProfileRoute = new UserProfileRoute();
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userProfileRoute, userRoute, permissionsRoute]);
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
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(newUser).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const getUserProfileResponse = await request(app.getServer())
        .get(userProfileRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(200);
      expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserProfileResponse.body;
      expect(typeof body).toBe('object');
      const { data: userProfile, message: getUserProfileMessage }: GetUserProfileResponseDto = body;
      expect(getUserProfileMessage).toBe(events.users.userProfileRetrieved);
      expect(userProfile).toBeDefined();
      expect(userProfile!.id).toBeDefined();
      expect(isGuid(userProfile!.id)).toBe(true);
      expect(userProfile!.id).toBe(newUserDto.id);
      expect(userProfile?.email).toBeDefined();
      expect(userProfile!.email).toBe(newUserDto.email);
      expect(userProfile?.phone).toBeDefined();
      expect(userProfile!.phone).toBe(newUserDto.phone);
      expect(userProfile!.hasOwnProperty('uuid')).toBe(false);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + userProfile!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserProfileRetrieved, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserProfileRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserProfileRetrieved).toHaveBeenCalledWith(new UserProfileRetrievedEvent(userProfile!, 1));
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should respond with a status code of 403', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const getUserProfileResponse = await request(app.getServer())
        .get(userProfileRoute.path + '/' + userId)
        .send();
      expect(getUserProfileResponse.statusCode).toBe(401);
      const body = getUserProfileResponse.body;
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

      const getUserProfileResponse = await request(app.getServer())
        .get(userProfileRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(403);
      expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserProfileResponse.body;
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
      expect(testEventHandlers.onUserProfileRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when user have all permissions expect PreviewUserProfile', async () => {
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
          if (value !== SystemPermission.PreviewUserProfile) {
            const path = permissionsRoute.path + '/' + newUserDto.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

      const getUserProfileResponse = await request(app.getServer())
        .get(userProfileRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(403);
      expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserProfileResponse.body;
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
      expect(testEventHandlers.onUserProfileRetrieved).not.toHaveBeenCalled();
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
      const getUserProfileResponse = await request(app.getServer())
        .get(userProfileRoute.path + '/' + userId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(400);
      expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserProfileResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: getUserProfileMessage, args: createArgs } = data;
      expect(getUserProfileMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(createArgs).toEqual({ id: userId });

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
      const getUserProfileResponse = await request(app.getServer())
        .get(userProfileRoute.path + '/invalid-guid')
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(404);
      expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserProfileResponse.body;
      expect(typeof body).toBe('object');
      const { message: deleteMessage }: { message: string } = body;
      expect(deleteMessage).toBe(errorKeys.general.Page_Does_Not_Exist);

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
      const getUserProfileResponse = await request(app.getServer())
        .get(userProfileRoute.path + '/' + userId)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(401);
      const body = getUserProfileResponse.body;
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
