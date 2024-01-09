import { App } from '@/app';
import { events } from '@events';
import { error_keys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { CreateUserDto, IUser, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { getAdminLoginData } from '@utils/tests.utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('POST/users should respond with a status code of 201', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  test('when data are valid and user has permission', async () => {
    const requestData = generateValidUser();
    const createResponse = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = createResponse.body;
    expect(typeof body).toBe('object');
    const { data: user, message: createMessage }: { data: IUser; message: string } = body;
    expect(user?.uuid).toBeDefined();
    expect(Guid.isGuid(user.uuid)).toBe(true);
    expect(user?.email).toBeDefined();
    expect(user?.phone).toBeDefined();
    expect(user.hasOwnProperty('id')).toBe(false);
    expect(createMessage).toBe(events.users.userCreated);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);
  });
});

describe('POST/users should respond with a status code of 400', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  test('when password is invalid', async () => {
    const requestData = <CreateUserDto>{ email: 'email@domain.com', phone: '123456789', password: 'paasssword' };
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(400);
    const errors = (<string>response.body.data.message)?.split(',');
    expect(errors.filter(x => x.indexOf('Password') === -1).length).toBe(0);
  });

  test('when email is invalid', async () => {
    const requestData = <CreateUserDto>{ password: 'strongPassword1@', phone: '123456789', email: 'invalid email' };
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(400);
    const errors = (<string>response.body.data.message)?.split(',');
    expect(errors.filter(x => x.indexOf('Email') === -1).length).toBe(0);
  });

  test('when phone is invalid', async () => {
    const requestData = <CreateUserDto>{ email: 'email@domain.com', password: 'strongPassword1@', phone: 'invalid phone' };
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(400);
    const errors = (<string>response.body.data.message)?.split(',');
    expect(errors.filter(x => x.indexOf('Phone') === -1).length).toBe(0);
  });
});

describe('POST/users should respond with a status code of 403', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  test('when token is not set', async () => {
    const requestData = generateValidUser();
    const response = await request(app.getServer()).post(usersRoute.path).send(requestData);
    expect(response.statusCode).toBe(403);
    const body = response.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(error_keys.login.User_Not_Authenticated);
  });

  test('when user have no permission', async () => {
    const requestData = generateValidUser();
    const newUserResponse = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(newUserResponse.statusCode).toBe(201);
    let body = newUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: user, message: createMessage }: { data: IUser; message: string } = body;
    expect(user?.uuid).toBeDefined();
    expect(user?.email).toBeDefined();
    expect(createMessage).toBe(events.users.userCreated);

    const newUserAuthToken = (await loginAs(app, <LoginDto>{ login: requestData.email, password: requestData.password })).authToken;
    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(generateValidUser())
      .set('Authorization', `Bearer ${newUserAuthToken}`);
    expect(createUserResponse.statusCode).toBe(403);
    expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = createUserResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(error_keys.login.User_Not_Authenticated);

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);
  });
});

describe('POST/users should respond with a status code of 401', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  test('when token is invalid', async () => {
    const requestData = generateValidUser();
    const response = await request(app.getServer())
      .post(usersRoute.path)
      .send(requestData)
      .set('Authorization', `Bearer invalid_token_${adminAuthToken}`);
    expect(response.statusCode).toBe(401);
    const body = response.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(error_keys.login.Wrong_Authentication_Token);
  });
});
