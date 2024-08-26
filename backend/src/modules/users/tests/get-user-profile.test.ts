/* eslint-disable no-prototype-builtins */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { CreateUserResponseDto, DeleteUserResponseDto, GetUserProfileResponseDto, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { isGuid } from '@utils';
import { registerTestEventHandlers, testEventHandlers } from '@utils/tests-events.utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('GET/users/:id should respond with a status code of 200', () => {
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

  test('when data are valid and user has permission', async () => {
    const newUser = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(newUser).set('Authorization', `Bearer ${adminAccessToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
    expect(newUserDto?.uuid).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(getUserProfileResponse.statusCode).toBe(200);
    expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = getUserProfileResponse.body;
    expect(typeof body).toBe('object');
    const { data: userProfile, message: getUserProfileMessage }: GetUserProfileResponseDto = body;
    expect(getUserProfileMessage).toBe(events.users.userRetrieved);
    expect(userProfile).toBeDefined();
    expect(userProfile!.uuid).toBeDefined();
    expect(isGuid(userProfile!.uuid)).toBe(true);
    expect(userProfile!.uuid).toBe(newUserDto.uuid);
    expect(userProfile?.email).toBeDefined();
    expect(userProfile!.email).toBe(newUserDto.email);
    expect(userProfile?.phone).toBeDefined();
    expect(userProfile!.phone).toBe(newUserDto.phone);
    expect(userProfile!.hasOwnProperty('id')).toBe(false);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + userProfile!.uuid)
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
    expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('GET/users/:id should respond with a status code of 403', () => {
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
    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + userId)
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

  test('when user have no permission', async () => {
    const requestData = generateValidUser();
    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(requestData)
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
    expect(newUserDto?.uuid).toBeDefined();
    expect(newUserDto?.email).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const activateNewUserResponse = await request(app.getServer())
      .post(usersRoute.path + '/' + newUserDto.uuid + '/' + usersRoute.activatePath)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(activateNewUserResponse.statusCode).toBe(200);

    const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;

    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${newUserAccessToken}`);
    expect(getUserProfileResponse.statusCode).toBe(403);
    expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = getUserProfileResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid }: DeleteUserResponseDto = body;
    expect(deletedUserUuid).toBe(newUserDto.uuid);

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

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('GET/users/:id should respond with a status code of 400', () => {
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

  test('GET/users/:id should respond with a status code of 400 when user not exist', async () => {
    const userId: string = Guid.EMPTY;
    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + userId)
      .send()
      .set('Authorization', `Bearer ${adminAccessToken}`);
    expect(getUserProfileResponse.statusCode).toBe(400);
    expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = getUserProfileResponse.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    const { message: getUserProfileMessage, args: createArgs }: { message: string; args: string[] } = data;
    expect(getUserProfileMessage).toBe(errorKeys.users.User_Does_Not_Exist);
    expect(createArgs.length).toBe(1);
    expect(createArgs[0]).toBe(userId);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('GET/users/:id should respond with a status code of 404', () => {
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

  test('GET/users/:id should respond with a status code of 404 when user Id is not GUID', async () => {
    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/invalid-guid')
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

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('GET/users/:id should respond with a status code of 401', () => {
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
    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + userId)
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

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
