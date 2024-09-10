import { App } from '@/app';
import { relatedDataNames } from '@db';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { AddPermissionsResponseDto, PermissionsRoute, SystemPermission } from '@modules/permissions';
import { CreateUserResponseDto, DeleteUserResponseDto, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { registerTestEventHandlers, testEventHandlers } from '@utils/tests-events.utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('DELETE/users should respond with a status code of 200', () => {
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

  test('when data are valid and logged user has permission', async () => {
    const user = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
    expect(newUserDto?.id).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + newUserDto.id)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: DeleteUserResponseDto = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(newUserDto.id);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
  });

  test('when a user have ony of system permissions granted by another user', async () => {
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

    const path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.PreviewUserList.toString();
    const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
    expect(addPermissionResult).toBe(true);
    expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

    const deleteUserWithSystemPermissionResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.id)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteUserWithSystemPermissionResponse.statusCode).toBe(200);
    expect(deleteUserWithSystemPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserWithSystemPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: DeleteUserResponseDto = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(user.id);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(
        ([, eventHandler]) =>
          ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted, testEventHandlers.onPermissionAdded].includes(eventHandler),
      )
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
  });

  test('when a user have ony of system permissions granted by himself', async () => {
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

    path = permissionsRoute.path + '/' + user.id + '/' + SystemPermission.PreviewUserList.toString();
    addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
    expect(addPermissionResponse.statusCode).toBe(201);
    expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = addPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
    expect(addPermission2Result).toBe(true);
    expect(addPermission2Message).toBe(events.permissions.permissionAdded);

    const deleteUserWithSystemPermissionResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.id)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteUserWithSystemPermissionResponse.statusCode).toBe(200);
    expect(deleteUserWithSystemPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserWithSystemPermissionResponse.body;
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
            testEventHandlers.onUserDeleted,
            testEventHandlers.onPermissionAdded,
            testEventHandlers.onUserLoggedIn,
          ].includes(eventHandler),
      )
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
    expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE/users should respond with a status code of 403', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);
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
    const userId: string = Guid.EMPTY;
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + userId)
      .send();
    expect(deleteResponse.statusCode).toBe(401);
    const body = deleteResponse.body;
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

    const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

    let deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.id)
      .send()
      .set('Authorization', `Bearer ${newUserAccessToken}`);
    expect(deleteResponse.statusCode).toBe(403);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

    deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.id)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
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

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE/users should respond with a status code of 400', () => {
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

  test('DELETE/users should respond with a status code of 400 when user not exist', async () => {
    const userId: string = Guid.EMPTY;
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + userId)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteResponse.statusCode).toBe(400);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    const { message: deleteMessage, args: deleteArgs }: { message: string; args: string[] } = data;
    expect(deleteMessage).toBe(errorKeys.users.User_Does_Not_Exist);
    expect(deleteArgs.length).toBe(1);
    expect(deleteArgs[0]).toBe(userId);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  test('when a user has granted ony of system permissions to another users', async () => {
    const user1RequestData = generateValidUser();

    let createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(user1RequestData)
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    const { data: user1 }: CreateUserResponseDto = body;
    expect(user1?.id).toBeDefined();

    let activateUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + user1.id + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(activateUserResponse.statusCode).toBe(200);

    let path = permissionsRoute.path + '/' + user1.id + '/' + SystemPermission.AddPermission.toString();
    const user1AddPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(user1AddPermissionResponse.statusCode).toBe(201);
    expect(user1AddPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = user1AddPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
    expect(addPermission1Result).toBe(true);
    expect(addPermission1Message).toBe(events.permissions.permissionAdded);

    const user2RequestData = generateValidUser();

    createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(user2RequestData)
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    body = createUserResponse.body;
    const { data: user2 }: CreateUserResponseDto = body;
    expect(user2?.id).toBeDefined();

    activateUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + user2.id + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(activateUserResponse.statusCode).toBe(200);

    const user1AccessToken = (await loginAs(app, { email: user1RequestData.email, password: user1RequestData.password } satisfies LoginDto))
      ?.accessToken;

    path = permissionsRoute.path + '/' + user2.id + '/' + SystemPermission.PreviewUserList.toString();
    const user2AddPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${user1AccessToken}`);
    expect(user2AddPermissionResponse.statusCode).toBe(201);
    expect(user2AddPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = user2AddPermissionResponse.body;
    expect(typeof body).toBe('object');
    const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
    expect(addPermission2Result).toBe(true);
    expect(addPermission2Message).toBe(events.permissions.permissionAdded);

    let deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user1.id)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteUserResponse.statusCode).toBe(400);
    expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteUserResponse.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    const { message: deleteUserMessage, args: deleteUserArgs }: { message: string; args: string[] } = data;
    expect(deleteUserMessage).toBe(errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted);
    expect(deleteUserArgs).toEqual([user1.id, relatedDataNames.SystemPermission_AssignedBy]);

    path = permissionsRoute.path + '/' + user1.id;
    let deleteAllPermissionsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteAllPermissionsResponse.statusCode).toBe(200);

    path = permissionsRoute.path + '/' + user2.id;
    deleteAllPermissionsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteAllPermissionsResponse.statusCode).toBe(200);

    deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user1.id)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);

    deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user2.id)
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
            testEventHandlers.onUserDeleted,
            testEventHandlers.onPermissionAdded,
            testEventHandlers.onPermissionDeleted,
            testEventHandlers.onUserLoggedIn,
          ].includes(eventHandler),
      )
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
    expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    expect(testEventHandlers.onPermissionDeleted).toHaveBeenCalled();
    expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE/users should respond with a status code of 404', () => {
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

  test('DELETE/users should respond with a status code of 404 when user Id is not GUID', async () => {
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/invalid-guid')
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteResponse.statusCode).toBe(404);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { message: deleteMessage }: { message: string } = body;
    expect(deleteMessage).toBe(errorKeys.general.Page_Does_Not_Exist);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('DELETE/users should respond with a status code of 401', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);
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
    const userId: string = Guid.EMPTY;
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + userId)
      .send()
      .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
    expect(deleteResponse.statusCode).toBe(401);
    const body = deleteResponse.body;
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
