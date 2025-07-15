import { events, ILoginModel, IUserDto, SystemPermissions } from '@core';
import { errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { getAdminLoginData } from '@utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import Container from 'typedi';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { AddPermissionsResponseDto } from '../dtos/add-permission.dto';
import { DeletePermissionsResponseDto } from '../dtos/delete-permissions.dto';
import { PermissionDeletedEvent } from '../events/permission-deleted-event';
import { PermissionsRoute } from '../routes/permissions.routes';
import { PermissionsService } from '../services/permissions.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('DELETE /permissions', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;
  let userLoggedIn: IUserDto;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    const loginResult = await app.auth.loginAs({ email, passcode } satisfies ILoginModel);
    adminAccessToken = loginResult?.accessToken;
    userLoggedIn = loginResult!;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('DELETE should respond with a status code of 404', () => {
    it('DELETE should respond with a status code of 404 when userId is missing', async () => {
      const path = PermissionsRoute.path + '/' + SystemPermissions.ActivateUser.toString();
      const response = await request(app!.getServer())
        .delete(path)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('DELETE should respond with a status code of 404 when userId is invalid', async () => {
      const response = await app!.permissions.delete(
        'invalid-user-id',
        SystemPermissions.ActivateUser,
        adminAccessToken,
      );
      expect(response.statusCode).toBe(404);
    });

    it('DELETE should respond with a status code of 404 when permissionId is invalid', async () => {
      const response = await app!.permissions.delete(userLoggedIn.id, 'invalid-permission-id', adminAccessToken);
      expect(response.statusCode).toBe(404);
    });

    it('DELETE should respond with a status code of 404 when userId and permissionId are missing', async () => {
      const path = PermissionsRoute.path;
      const response = await request(app!.getServer())
        .delete(path)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('DELETE should respond with a status code of 404 when userId and permissionId are invalid', async () => {
      const response = await app!.permissions.delete('invalid-user-id', 'invalid-permission-id', adminAccessToken);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE should respond with a status code of 400', () => {
    it('DELETE should respond with a status code of 400 when user not exist', async () => {
      const response = await app!.permissions.delete(Guid.EMPTY, SystemPermissions.ActivateUser, adminAccessToken);
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
      const path = PermissionsRoute.path + '/' + Guid.EMPTY;
      const response = await request(app!.getServer())
        .delete(path)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(400);
    });

    it('DELETE should respond with a status code of 400 when permission not exist', async () => {
      const newUser = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      const response = await app!.permissions.delete(
        newUserDto.id,
        SystemPermissions.PreviewUserList - 1,
        adminAccessToken,
      );
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
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });
  });

  describe('DELETE should respond with a status code of 401', () => {
    it('when token is invalid', async () => {
      const response = await app!.permissions.delete(
        Guid.EMPTY,
        SystemPermissions.PreviewUserList,
        `invalid_token_${adminAccessToken}`,
      );
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
      const response = await app!.permissions.delete(Guid.EMPTY, SystemPermissions.PreviewUserList);
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
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionResponse = await app!.permissions.add(
        user.id,
        SystemPermissions.PreviewUserList,
        adminAccessToken,
      );
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
      expect(addPermissionResult).toBe(true);
      expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const deletePermissionResponse = await app!.permissions.delete(
        user.id,
        SystemPermissions.DeletePermission,
        newUserAccessToken,
      );
      expect(deletePermissionResponse.statusCode).toBe(403);
      expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionResponse.body;
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
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });

    it('when user have all permissions expect DeletePermission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(user.id, adminAccessToken, [
        SystemPermissions.DeletePermission,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const deletePermissionResponse = await app!.permissions.delete(
        user.id,
        SystemPermissions.PreviewUserList,
        newUserAccessToken,
      );
      expect(deletePermissionResponse.statusCode).toBe(403);
      expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionResponse.body;
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
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('DELETE should respond with a status code of 200', () => {
    it('when user have permissions to delete systemPermission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      let addPermissionResponse = await app!.permissions.add(
        user.id,
        SystemPermissions.DeletePermission,
        adminAccessToken,
      );
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
      expect(addPermission1Result).toBe(true);
      expect(addPermission1Message).toBe(events.permissions.permissionAdded);

      addPermissionResponse = await app!.permissions.add(user.id, SystemPermissions.AddPermission, adminAccessToken);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
      expect(addPermission2Result).toBe(true);
      expect(addPermission2Message).toBe(events.permissions.permissionAdded);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const deletePermissionResponse = await app!.permissions.delete(
        user.id,
        SystemPermissions.AddPermission,
        newUserAccessToken,
      );
      expect(deletePermissionResponse.statusCode).toBe(200);
      expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletePermissionResult, message: deletePermissionMessage }: DeletePermissionsResponseDto = body;
      expect(deletePermissionResult).toBe(true);
      expect(deletePermissionMessage).toBe(events.permissions.permissionDeleted);

      addPermissionResponse = await app!.permissions.add(user.id, SystemPermissions.AddPermission, newUserAccessToken);
      expect(addPermissionResponse.statusCode).toBe(403);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
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
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const deletePermissionResponse = await app!.permissions.delete(
        user.id,
        SystemPermissions.PreviewUserList,
        adminAccessToken,
      );
      expect(deletePermissionResponse.statusCode).toBe(200);
      expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletePermissionResult, message: deletePermissionMessage }: DeletePermissionsResponseDto = body;
      expect(deletePermissionResult).toBe(true);
      expect(deletePermissionMessage).toBe(events.permissions.permissionDeleted);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionDeleted).toHaveBeenCalledWith(
        new PermissionDeletedEvent(user.id, SystemPermissions.PreviewUserList, 1),
      );
    });

    it('when we want to revoke all system permissions for user', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();

      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      let addPermissionResponse = await app!.permissions.add(
        user.id,
        SystemPermissions.AddPermission,
        adminAccessToken,
      );
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
      expect(addPermission1Result).toBe(true);
      expect(addPermission1Message).toBe(events.permissions.permissionAdded);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      addPermissionResponse = await app!.permissions.add(
        user.id,
        SystemPermissions.PreviewUserDetails,
        newUserAccessToken,
      );
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
      expect(addPermission2Result).toBe(true);
      expect(addPermission2Message).toBe(events.permissions.permissionAdded);

      const deletePermissionsResponse = await app!.permissions.removeAllUserPermissions(user.id, adminAccessToken);
      expect(deletePermissionsResponse.statusCode).toBe(200);
      expect(deletePermissionsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deletePermissionsResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletePermissionResult, message: deletePermissionMessage }: DeletePermissionsResponseDto = body;
      expect(deletePermissionResult).toBe(true);
      expect(deletePermissionMessage).toBe(events.permissions.permissionDeleted);

      const getUserDetailsResponse = await app!.userDetails.get(user.id, newUserAccessToken);
      expect(getUserDetailsResponse.statusCode).toBe(403);

      addPermissionResponse = await app!.permissions.add(
        user.id,
        SystemPermissions.PreviewUserDetails,
        newUserAccessToken,
      );
      expect(addPermissionResponse.statusCode).toBe(403);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
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

  describe('DELETE should handle errors', () => {
    it('when service throws an error', async () => {
      const permissionsService = Container.get(PermissionsService);
      const mockGet = jest.spyOn(permissionsService, 'delete').mockRejectedValue(new Error('Service error'));
      const response = await app!.permissions.delete(Guid.EMPTY, SystemPermissions.DeletePermission, adminAccessToken);
      expect(response.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
