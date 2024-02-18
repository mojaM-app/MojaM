/* eslint-disable no-prototype-builtins */
import { App } from '@/app';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { IUser, IUserProfile, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { isGuid } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('GET/users/:id should respond with a status code of 200', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;
  });

  test('when data are valid and user has permission', async () => {
    const newUser = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(newUser).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    const { data: newUserDto, message: createMessage }: { data: IUser, message: string } = createUserResponse.body;
    expect(newUserDto?.uuid).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(getUserProfileResponse.statusCode).toBe(200);
    expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = getUserProfileResponse.body;
    expect(typeof body).toBe('object');
    const { data: userProfile, message: getUserProfileMessage }: { data: IUserProfile, message: string } = body;
    expect(getUserProfileMessage).toBe(events.users.userRetrieved);
    expect(userProfile).toBeDefined();
    expect(userProfile.uuid).toBeDefined();
    expect(isGuid(userProfile.uuid)).toBe(true);
    expect(userProfile.uuid).toBe(newUserDto.uuid);
    expect(userProfile?.email).toBeDefined();
    expect(userProfile.email).toBe(newUserDto.email);
    expect(userProfile?.phone).toBeDefined();
    expect(userProfile.phone).toBe(newUserDto.phone);
    expect(userProfile.hasOwnProperty('id')).toBe(false);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + userProfile.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);
  });
});

describe('GET/users/:id should respond with a status code of 403', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, ({ login, password } satisfies LoginDto))).authToken;
  });

  test('when token is not set', async () => {
    const userId: string = Guid.EMPTY;
    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + userId)
      .send();
    expect(getUserProfileResponse.statusCode).toBe(403);
    const body = getUserProfileResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);
  });

  test('when user have no permission', async () => {
    const requestData = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    let body = createUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: newUserDto, message: createMessage }: { data: IUser, message: string } = body;
    expect(newUserDto?.uuid).toBeDefined();
    expect(newUserDto?.email).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const newUserAuthToken = (await loginAs(app, ({ login: requestData.email, password: requestData.password } satisfies LoginDto))).authToken;
    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${newUserAuthToken}`);
    expect(getUserProfileResponse.statusCode).toBe(403);
    expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = getUserProfileResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: { data: string, message: string } = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(newUserDto.uuid);
  });
});

describe('GET/users/:id should respond with a status code of 400', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, ({ login, password } satisfies LoginDto))).authToken;
  });

  test('GET/users/:id should respond with a status code of 400 when user not exist', async () => {
    const userId: string = Guid.EMPTY;
    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + userId)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(getUserProfileResponse.statusCode).toBe(400);
    expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = getUserProfileResponse.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    const { message: getUserProfileMessage, args: createArgs }: { message: string, args: string[] } = data;
    expect(getUserProfileMessage).toBe(errorKeys.users.User_Does_Not_Exist);
    expect(createArgs.length).toBe(1);
    expect(createArgs[0]).toBe(userId);
  });
});

describe('GET/users/:id should respond with a status code of 404', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, ({ login, password } satisfies LoginDto))).authToken;
  });

  test('GET/users/:id should respond with a status code of 404 when user Id is not GUID', async () => {
    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/invalid-guid')
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(getUserProfileResponse.statusCode).toBe(404);
    expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = getUserProfileResponse.body;
    expect(typeof body).toBe('object');
    const { message: deleteMessage }: { message: string } = body;
    expect(deleteMessage).toBe(errorKeys.general.Page_Does_Not_Exist);
  });
});

describe('GET/users/:id should respond with a status code of 401', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, ({ login, password } satisfies LoginDto))).authToken;
  });

  test('when token is invalid', async () => {
    const userId: string = Guid.EMPTY;
    const getUserProfileResponse = await request(app.getServer())
      .get(usersRoute.path + '/' + userId)
      .send()
      .set('Authorization', `Bearer invalid_token_${adminAuthToken}`);
    expect(getUserProfileResponse.statusCode).toBe(401);
    const body = getUserProfileResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.Wrong_Authentication_Token);
  });
});
