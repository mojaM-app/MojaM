import { App } from '@/app';
import { events } from '@events/events';
import { error_keys } from '@exceptions/error.keys';
import { AuthRoute } from '@modules/auth/auth.routes';
import { LoginDto } from '@modules/auth/dtos/login.dto';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { IUser } from '@modules/users/interfaces/IUser';
import { UsersRoute } from '@modules/users/users.routes';
import { getAdminLoginData, getJwtToken } from '@utils/tests.utils';
import request from 'supertest';
import { generateValidUser } from './user-tests.helpers';

describe('POST/users should respond with a status code of 201', () => {
  const usersRoute = new UsersRoute();
  const authRoute = new AuthRoute();
  const app = new App([usersRoute, authRoute]);

  let token: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    const loginResponse = await request(app.getServer())
      .post(authRoute.loginPath)
      .send(<LoginDto>{ login, password });

    token = loginResponse.statusCode === 200 ? getJwtToken(loginResponse) : '';
  });

  test('POST/users should respond with a status code of 201 and DELETE/users should respond with a status code of 200', async () => {
    const requestData = generateValidUser();
    const createResponse = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${token}`);
    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    let body = createResponse.body;
    expect(typeof body).toBe('object');
    const { data: user, message: createMessage }: { data: IUser; message: string } = body;
    expect(user?.uuid).toBeDefined();
    expect(user?.email).toBeDefined();
    expect(user?.phone).toBeDefined();
    expect(user.hasOwnProperty('id')).toBe(false);
    expect(createMessage).toBe(events.users.userCreated);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(user.uuid);
  });
});

describe('POST/users should respond with a status code of 400', () => {
  const usersRoute = new UsersRoute();
  const authRoute = new AuthRoute();
  const app = new App([usersRoute, authRoute]);

  let token: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    const loginResponse = await request(app.getServer())
      .post(authRoute.loginPath)
      .send(<LoginDto>{ login, password });

    token = loginResponse.statusCode === 200 ? getJwtToken(loginResponse) : '';
  });

  test('when password is invalid', async () => {
    const requestData = <CreateUserDto>{ email: 'email@domain.com', phone: '123456789', password: 'paasssword' };
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
    const errors = (<string>response.body.data.message)?.split(',');
    expect(errors.filter(x => x.indexOf('Password') === -1).length).toBe(0);
  });

  test('when email is invalid', async () => {
    const requestData = <CreateUserDto>{ password: 'strongPassword1@', phone: '123456789', email: 'invalid email' };
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
    const errors = (<string>response.body.data.message)?.split(',');
    expect(errors.filter(x => x.indexOf('Email') === -1).length).toBe(0);
  });

  test('when phone is invalid', async () => {
    const requestData = <CreateUserDto>{ email: 'email@domain.com', password: 'strongPassword1@', phone: 'invalid phone' };
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
    const errors = (<string>response.body.data.message)?.split(',');
    expect(errors.filter(x => x.indexOf('Phone') === -1).length).toBe(0);
  });
});

describe('POST/users should respond with a status code of 403', () => {
  const usersRoute = new UsersRoute();
  const authRoute = new AuthRoute();
  const app = new App([usersRoute, authRoute]);

  let token: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    const loginResponse = await request(app.getServer())
      .post(authRoute.loginPath)
      .send(<LoginDto>{ login, password });

    token = loginResponse.statusCode === 200 ? getJwtToken(loginResponse) : '';
  });

  test('when token is not set', async () => {
    const requestData = generateValidUser();
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData);
    expect(response.statusCode).toBe(403);
    const body = response.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(error_keys.users.login.User_Not_Authenticated);
  });

  test('when user have no permission', async () => {
    const requestData = generateValidUser();
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(201);
    let body = response.body;
    expect(typeof body).toBe('object');
    const { data: user, message: createMessage }: { data: IUser; message: string } = body;
    expect(user?.uuid).toBeDefined();
    expect(user?.email).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = deleteResponse.body;
    expect(typeof body).toBe('object');
    const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
    expect(deleteMessage).toBe(events.users.userDeleted);
    expect(deletedUserUuid).toBe(user.uuid);
  });
});

describe('POST/users should respond with a status code of 401', () => {
  const usersRoute = new UsersRoute();
  const authRoute = new AuthRoute();
  const app = new App([usersRoute, authRoute]);

  let token: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    const loginResponse = await request(app.getServer())
      .post(authRoute.loginPath)
      .send(<LoginDto>{ login, password });

    token = loginResponse.statusCode === 200 ? getJwtToken(loginResponse) : '';
  });

  test('when token is invalid', async () => {
    const requestData = generateValidUser();
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer invalid_token_${token}`);
    expect(response.statusCode).toBe(401);
    const body = response.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(error_keys.users.login.Wrong_Authentication_Token);
  });
});
