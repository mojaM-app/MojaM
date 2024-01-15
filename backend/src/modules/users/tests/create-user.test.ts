/* eslint-disable no-prototype-builtins */
import { App } from '@/app';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { LoginDto } from '@modules/auth';
import { CreateUserDto, IUser, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { isGuid } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import request from 'supertest';

describe('POST/users should respond with a status code of 201', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;
  });

  test('when data are valid and user has permission', async () => {
    const requestData = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = createUserResponse.body;
    expect(typeof body).toBe('object');
    const { data: user, message: createMessage }: { data: IUser; message: string } = body;
    expect(user?.uuid).toBeDefined();
    expect(isGuid(user.uuid)).toBe(true);
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

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;
  });

  test('when password is invalid', async () => {
    const requestData = { email: 'email@domain.com', phone: '123456789', password: 'paasssword' } satisfies CreateUserDto;
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(400);
    const errors = (createUserResponse.body.data.message as string)?.split(',');
    expect(errors.filter(x => !x.includes('Password')).length).toBe(0);
  });

  test('when email is invalid', async () => {
    const requestData = { password: 'strongPassword1@', phone: '123456789', email: 'invalid email' } satisfies CreateUserDto;
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(400);
    const errors = (createUserResponse.body.data.message as string)?.split(',');
    expect(errors.filter(x => !x.includes('Email')).length).toBe(0);
  });

  test('when phone is invalid', async () => {
    const requestData = { email: 'email@domain.com', password: 'strongPassword1@', phone: 'invalid phone' } satisfies CreateUserDto;
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(400);
    const errors = (createUserResponse.body.data.message as string)?.split(',');
    expect(errors.filter(x => !x.includes('Phone')).length).toBe(0);
  });

  test('when exist user with same email and phone', async () => {
    const requestData = generateValidUser();
    const createUserResponse1 = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse1.statusCode).toBe(201);
    const { data: user, message: createMessage }: { data: IUser; message: string } = createUserResponse1.body;
    expect(createMessage).toBe(events.users.userCreated);

    const createUserResponse2 = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse2.statusCode).toBe(400);
    const body = createUserResponse2.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.users.User_Already_Exists);

    const deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);
  });

  test('when exist user with same email and phone (different letters size)', async () => {
    const requestData = generateValidUser();
    const createUserResponse1 = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse1.statusCode).toBe(201);
    const { data: user, message: createMessage }: { data: IUser; message: string } = createUserResponse1.body;
    expect(createMessage).toBe(events.users.userCreated);

    requestData.email = requestData.email?.toUpperCase();
    const createUserResponse2 = await request(app.getServer()).post(usersRoute.path).send(requestData).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse2.statusCode).toBe(400);
    const body = createUserResponse2.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.users.User_Already_Exists);

    const deleteUserResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + user.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteUserResponse.statusCode).toBe(200);
  });
});

describe('POST/users should respond with a status code of 403', () => {
  const usersRoute = new UsersRoute();
  const app = new App([usersRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;
  });

  test('when token is not set', async () => {
    const requestData = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(requestData);
    expect(createUserResponse.statusCode).toBe(403);
    const body = createUserResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);
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

    const newUserAuthToken = (await loginAs(app, { login: requestData.email, password: requestData.password } satisfies LoginDto)).authToken;
    const createUserResponse = await request(app.getServer())
      .post(usersRoute.path)
      .send(generateValidUser())
      .set('Authorization', `Bearer ${newUserAuthToken}`);
    expect(createUserResponse.statusCode).toBe(403);
    expect(createUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    body = createUserResponse.body;
    expect(typeof body).toBe('object');
    expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

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

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;
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
    expect(body.data.message).toBe(errorKeys.login.Wrong_Authentication_Token);
  });
});
