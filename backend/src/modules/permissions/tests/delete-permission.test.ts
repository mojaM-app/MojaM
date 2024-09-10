/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import {
  AddPermissionsResponseDto,
  DeletePermissionsResponseDto,
  PermissionDeletedEvent,
  PermissionsRoute,
  SystemPermission,
} from '@modules/permissions';
import { CreateUserResponseDto, DeleteUserResponseDto, IUserDto, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { registerTestEventHandlers, testEventHandlers } from '@utils/tests-events.utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('DELETE /permissions/userId/permissionId should respond with a status code of 404', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);
  let adminAccessToken: string | undefined;
  let userLoggedIn: IUserDto;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    const loginResult = await loginAs(app, { email: login, password } satisfies LoginDto);
    adminAccessToken = loginResult?.accessToken;
    userLoggedIn = loginResult!;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  it('DELETE /permissions/userId/permissionId should respond with a status code of 404 when userId is missing', async () => {
    const path = permissionsRoute.path + '/' + SystemPermission.ActivateUser.toString();
    const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(404);
  });

  it('DELETE /permissions/userId/permissionId should respond with a status code of 404 when userId is invalid', async () => {
    const path = permissionsRoute.path + '/invalid-user-id/' + SystemPermission.ActivateUser.toString();
    const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(404);
  });

  it('DELETE /permissions/userId/permissionId should respond with a status code of 404 when permissionId is invalid', async () => {
    const path = permissionsRoute.path + '/' + userLoggedIn.id + '/invalid-permission-id';
    const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(404);
  });

  it('DELETE /permissions/userId/permissionId should respond with a status code of 404 when userId and permissionId are missing', async () => {
    const path = permissionsRoute.path;
    const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(404);
  });

  it('DELETE /permissions/userId/permissionId should respond with a status code of 404 when userId and permissionId are invalid', async () => {
    const path = permissionsRoute.path + '/invalid-user-id/invalid-permission-id';
    const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(404);
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE /permissions/userId/permissionId should respond with a status code of 400', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);
  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email: login, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('DELETE /permissions/userId/permissionId should respond with a status code of 400 when user not exist', async () => {
    const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermission.ActivateUser.toString();
    const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = response.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    expect(data).toBe(false);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  test('DELETE /permissions/userId/permissionId should respond with a status code of 400 when user not exist and permissionId is missing', async () => {
    const path = permissionsRoute.path + '/' + Guid.EMPTY;
    const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(400);
  });

  test('DELETE /permissions/userId/permissionId should respond with a status code of 400 when permission not exist', async () => {
    const newUser = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(newUser).set('Authorization', `Bearer ${adminAccessToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
    expect(newUserDto?.id).toBeDefined();

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + newUserDto.id)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteResponse.statusCode).toBe(200);

    const path = permissionsRoute.path + '/' + newUserDto.id + '/' + (SystemPermission.PreviewUserList - 1).toString();
    const response = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = response.body;
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

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE /permissions/userId/permissionId should respond with a status code of 401', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email: login, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('when token is invalid', async () => {
    const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermission.PreviewUserList.toString();
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

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE /permissions/userId/permissionId should respond with a status code of 403', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email: login, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('when token is not set', async () => {
    const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermission.PreviewUserList.toString();
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

  test('when user have no permission', async () => {
    const requestData = generateValidUser();

    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
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
      .post(usersRoute.path + '/' + user.id + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(activateNewUserResponse.statusCode).toBe(200);

    let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.PreviewUserList.toString();
    const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
    expect(addPermissionResult).toBe(true);
    expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

    const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

    path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.PreviewUserList.toString();
    const deletePermissionResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
    expect(deletePermissionResponse.statusCode).toBe(403);
    expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deletePermissionResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

    const deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.id)
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

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE /permissions/userId/permissionId should respond with a status code of 200', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email: login, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('when user have permissions to delete systemPermission', async () => {
    const requestData = generateValidUser();

    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(requestData)
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    const { data: user }: CreateUserResponseDto = body;
    expect(user?.id).toBeDefined();

    const activateNewUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + user.id + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(activateNewUserResponse.statusCode).toBe(200);

    let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.DeletePermission.toString();
    let addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
    expect(addPermission1Result).toBe(true);
    expect(addPermission1Message).toBe(events.permissions.permissionAdded);

    path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.AddPermission.toString();
    addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
    expect(addPermission2Result).toBe(true);
    expect(addPermission2Message).toBe(events.permissions.permissionAdded);

    const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

    path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.AddPermission.toString();
    const deletePermissionResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
    expect(deletePermissionResponse.statusCode).toBe(200);
    expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deletePermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletePermissionResult, message: deletePermissionMessage }: DeletePermissionsResponseDto = body;
    expect(deletePermissionResult).toBe(true);
    expect(deletePermissionMessage).toBe(events.permissions.permissionDeleted);

    path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.AddPermission.toString();
    addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
    expect(addPermissionResponse.statusCode).toBe(403);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

    const deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.id)
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

  test('when the user whose permission we want to revoke does not have this permission', async () => {
    const requestData = generateValidUser();

    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(requestData)
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    const { data: user }: CreateUserResponseDto = body;
    expect(user?.id).toBeDefined();

    const path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.PreviewUserList.toString();
    const deletePermissionResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deletePermissionResponse.statusCode).toBe(200);
    expect(deletePermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deletePermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletePermissionResult, message: deletePermissionMessage }: DeletePermissionsResponseDto = body;
    expect(deletePermissionResult).toBe(true);
    expect(deletePermissionMessage).toBe(events.permissions.permissionDeleted);

    const deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.id)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);
    expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: DeleteUserResponseDto = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(user.id);

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
    expect(testEventHandlers.onPermissionDeleted).toHaveBeenCalledWith(new PermissionDeletedEvent(user.id, SystemPermission.PreviewUserList, 1));
  });

  test('when we want to revoke all system permissions for user', async () => {
    const requestData = generateValidUser();

    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(requestData)
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    const { data: user }: CreateUserResponseDto = body;
    expect(user?.id).toBeDefined();

    const activateNewUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + user.id + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(activateNewUserResponse.statusCode).toBe(200);

    let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.AddPermission.toString();
    let addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
    expect(addPermission1Result).toBe(true);
    expect(addPermission1Message).toBe(events.permissions.permissionAdded);

    const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

    path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.PreviewUserProfile.toString();
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
      .get(usersRoute.path + '/' + user.id)
      .send()
      .set('Authorization', `Bearer ${newUserAccessToken}`);
    expect(getUserProfileResponse.statusCode).toBe(403);

    path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.PreviewUserProfile.toString();
    addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
    expect(addPermissionResponse.statusCode).toBe(403);

    const deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.id)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);
    expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: DeleteUserResponseDto = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(user.id);

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

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
