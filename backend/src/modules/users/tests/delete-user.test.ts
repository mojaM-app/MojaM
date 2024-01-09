import { App } from '@/app';
import { events } from '@events';
import { error_keys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { IUser, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { getAdminLoginData } from '@utils/tests.utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('DELETE/users should respond with a status code of 200', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  test('when data are valid and user has permission', async () => {
    const user = generateValidUser();
    const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createResponse.statusCode).toBe(201);
    const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
    expect(newUserDto?.uuid).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(newUserDto.uuid);
  });
});

describe('DELETE/users should respond with a status code of 403', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  test('when token is not set', async () => {
    const userId: string = Guid.EMPTY;
    const response = await request(app.getServer())
      .delete(usersRoute.path + '/' + userId)
      .send();
    expect(response.statusCode).toBe(403);
    const body = response.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(error_keys.login.User_Not_Authenticated);
  });

  test('when user have no permission', async () => {
    const requestData = generateValidUser();
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(201);
    let body = response.body;
    expect(typeof body).toBe('object');
    const { data: user, message: createMessage }: { data: IUser; message: string } = body;
    expect(user?.uuid).toBeDefined();
    expect(user?.email).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const newUserAuthToken = (await loginAs(app, <LoginDto>{ login: requestData.email, password: requestData.password })).authToken;
    let deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${newUserAuthToken}`);
    expect(deleteResponse.statusCode).toBe(403);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(error_keys.login.User_Not_Authenticated);

    deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(user.uuid);
  });
});

describe('DELETE/users should respond with a status code of 400', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  test('DELETE/users should respond with a status code of 400 when user not exist', async () => {
    const userId: string = Guid.EMPTY;
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + userId)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(400);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    const { message: deleteMessage, args: deleteArgs }: { message: string; args: string[] } = data;
    expect(deleteMessage).toBe(error_keys.users.User_Does_Not_Exist);
    expect(deleteArgs.length).toBe(1);
    expect(deleteArgs[0]).toBe(userId);
  });
});

describe('DELETE/users should respond with a status code of 404', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  test('DELETE/users should respond with a status code of 404 when user Id is not GUID', async () => {
    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/invalid-guid')
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(404);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { message: deleteMessage }: { message: string } = body;
    expect(deleteMessage).toBe(error_keys.general.Page_Does_Not_Exist);
  });
});

describe('DELETE/users should respond with a status code of 401', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  test('when token is invalid', async () => {
    const userId: string = Guid.EMPTY;
    const response = await request(app.getServer())
      .delete(usersRoute.path + '/' + userId)
      .send()
      .set('Authorization', `Bearer invalid_token_${adminAuthToken}`);
    expect(response.statusCode).toBe(401);
    const body = response.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(error_keys.login.Wrong_Authentication_Token);
  });
});
