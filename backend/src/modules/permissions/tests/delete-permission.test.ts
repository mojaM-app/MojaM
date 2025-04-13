/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUserWithPassword, loginAs } from '@helpers/user-tests.helpers';
import { LoginDto } from '@modules/auth';
import {
  AddPermissionsResponseDto,
  DeletePermissionsResponseDto,
  PermissionDeletedEvent,
  PermissionsRoute,
  SystemPermissions,
} from '@modules/permissions';
import { CreateUserResponseDto, IUserDto, UserDetailsRoute, UserRoute } from '@modules/users';
import { isNumber } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { App } from './../../../app';

describe('DELETE /permissions', () => {
  const userRoute = new UserRoute();
  const userDetailsRoute = new UserDetailsRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let adminAccessToken: string | undefined;
  let mockSendMail: any;
  let userLoggedIn: IUserDto;

  beforeAll(async () => {
    await app.initialize([userRoute, userDetailsRoute, permissionsRoute]);
    const { email, passcode } = getAdminLoginData();

    const loginResult = await loginAs(app, { email, passcode } satisfies LoginDto);
    adminAccessToken = loginResult?.accessToken;
    userLoggedIn = loginResult!;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    mockSendMail = jest.fn().mockImplementation((mailOptions: any, callback: (error: any, info: any) => void) => {
      callback(null, null);
    });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
      close: jest.fn().mockImplementation(() => {}),
    } as any);
  });

  describe('DELETE should respond with a status code of 404', () => {
    it('DELETE should respond with a status code of 404 when userId is missing', async () => {
      const path = permissionsRoute.path + '/' + SystemPermissions.ActivateUser.toString();
      const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('DELETE should respond with a status code of 404 when userId is invalid', async () => {
      const path = permissionsRoute.path + '/invalid-user-id/' + SystemPermissions.ActivateUser.toString();
      const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('DELETE should respond with a status code of 404 when permissionId is invalid', async () => {
      const path = permissionsRoute.path + '/' + userLoggedIn.id + '/invalid-permission-id';
      const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('DELETE should respond with a status code of 404 when userId and permissionId are missing', async () => {
      const path = permissionsRoute.path;
      const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('DELETE should respond with a status code of 404 when userId and permissionId are invalid', async () => {
      const path = permissionsRoute.path + '/invalid-user-id/invalid-permission-id';
      const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE should respond with a status code of 400', () => {
    it('DELETE should respond with a status code of 400 when user not exist', async () => {
      const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermissions.ActivateUser.toString();
      const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as DeletePermissionsResponseDto;
      expect(typeof body).toBe('object');
      const data = body.data;
      expect(data).toBe(false);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('DELETE should respond with a status code of 400 when user not exist and permissionId is missing', async () => {
      const path = permissionsRoute.path + '/' + Guid.EMPTY;
      const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(400);
    });

    it('DELETE should respond with a status code of 400 when permission not exist', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(newUser).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      const path = permissionsRoute.path + '/' + newUserDto.id + '/' + (SystemPermissions.PreviewUserList - 1).toString();
      const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as DeletePermissionsResponseDto;
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

  describe('DELETE should respond with a status code of 401', () => {
    it('when token is invalid', async () => {
      const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermissions.PreviewUserList.toString();
      const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(response.statusCode).toBe(401);
      const body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('DELETE should respond with a status code of 403', () => {
    it('when token is not set', async () => {
      const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermissions.PreviewUserList.toString();
      const response = await request(app.getServer()).delete(path).send();
      expect(response.statusCode).toBe(401);
      const body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user has no permission', async () => {
      const requestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
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

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
      expect(addPermissionResult).toBe(true);
      expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      const deletePermissionResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(deletePermissionResponse.statusCode).toBe(403);
      expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
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

    it('when user have all permissions expect DeletePermission', async () => {
      const requestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
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

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.DeletePermission) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      const path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      const deletePermissionResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(deletePermissionResponse.statusCode).toBe(403);
      expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
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

  describe('DELETE should respond with a status code of 200', () => {
    it('when user have permissions to delete systemPermission', async () => {
      const requestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.DeletePermission.toString();
      let addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
      expect(addPermission1Result).toBe(true);
      expect(addPermission1Message).toBe(events.permissions.permissionAdded);

      path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.AddPermission.toString();
      addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
      expect(addPermission2Result).toBe(true);
      expect(addPermission2Message).toBe(events.permissions.permissionAdded);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.AddPermission.toString();
      const deletePermissionResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(deletePermissionResponse.statusCode).toBe(200);
      expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletePermissionResult, message: deletePermissionMessage }: DeletePermissionsResponseDto = body;
      expect(deletePermissionResult).toBe(true);
      expect(deletePermissionMessage).toBe(events.permissions.permissionDeleted);

      path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.AddPermission.toString();
      addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(403);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
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
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserActivated,
              testEventHandlers.onPermissionAdded,
              testEventHandlers.onPermissionDeleted,
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
      expect(testEventHandlers.onPermissionDeleted).toHaveBeenCalled();
    });

    it('when the user whose permission we want to revoke does not have this permission', async () => {
      const requestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      const deletePermissionResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deletePermissionResponse.statusCode).toBe(200);
      expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletePermissionResult, message: deletePermissionMessage }: DeletePermissionsResponseDto = body;
      expect(deletePermissionResult).toBe(true);
      expect(deletePermissionMessage).toBe(events.permissions.permissionDeleted);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted, testEventHandlers.onPermissionDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionDeleted).toHaveBeenCalledWith(new PermissionDeletedEvent(user.id, SystemPermissions.PreviewUserList, 1));
    });

    it('when we want to revoke all system permissions for user', async () => {
      const requestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.AddPermission.toString();
      let addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
      expect(addPermission1Result).toBe(true);
      expect(addPermission1Message).toBe(events.permissions.permissionAdded);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserDetails.toString();
      addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
      expect(addPermission2Result).toBe(true);
      expect(addPermission2Message).toBe(events.permissions.permissionAdded);

      path = permissionsRoute.path + '/' + user.id;
      const deletePermissionResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deletePermissionResponse.statusCode).toBe(200);
      expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletePermissionResult, message: deletePermissionMessage }: DeletePermissionsResponseDto = body;
      expect(deletePermissionResult).toBe(true);
      expect(deletePermissionMessage).toBe(events.permissions.permissionDeleted);

      const getUserProfileResponse = await request(app.getServer())
        .get(userDetailsRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(403);

      path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserDetails.toString();
      addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(403);

      const deleteUserResponse = await request(app.getServer())
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
              testEventHandlers.onPermissionAdded,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionDeleted,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionDeleted).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
