import { App } from '@/app';
import { events } from '@events';
import { error_keys } from '@exceptions';
import { AuthRoute, LoginDto, RequestWithIdentity, setIdentity } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { IUser, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { getAdminLoginData } from '@utils/tests.utils';
import { NextFunction } from 'express';
import request from 'supertest';

describe('POST /login', () => {
  const usersRoute = new UsersRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, <LoginDto>{ login, password })).authToken;
  });

  describe('when login data are valid', () => {
    it('(login via email and password) response should have the Set-Cookie header with the Authorization token when login data are correct', async () => {
      const { email: login, password } = getAdminLoginData();
      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send(<LoginDto>{ login, password });
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage, args: loginArgs } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(loginArgs).toBeUndefined();
      expect(userLoggedIn.email).toBe(login);
      const cookies = headers['set-cookie'];
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies.length).toBe(1);
      const cookie = cookies[0];
      expect(cookie).toBeDefined();
      expect(cookie.length).toBeGreaterThan(1);
      const token = cookie.split(';')[0].split('=')[1];
      const req = {
        cookies: {
          Authorization: token,
        },
      };
      const next: NextFunction = jest.fn();
      await setIdentity(req as any, {} as any, next);
      expect((req as RequestWithIdentity).identity.userUuid).toEqual(userLoggedIn.uuid);
      expect((req as RequestWithIdentity).identity.hasPermissionToEditUserProfile()).toBeTruthy();
      expect(next).toHaveBeenCalled();
    });

    it('(login via phone and password) response should have the Set-Cookie header with the Authorization token when login data are correct', async () => {
      const { phone: login, password } = getAdminLoginData();
      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send(<LoginDto>{ login, password });
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      expect(loginResponse.statusCode).toBe(200);
      const headers = loginResponse.headers;
      expect(headers['content-type']).toEqual(expect.stringContaining('json'));
      const { data: userLoggedIn, message: loginMessage, args: loginArgs } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(loginArgs).toBeUndefined();
      expect(userLoggedIn.phone).toBe(login);
      const cookies = headers['set-cookie'];
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies.length).toBe(1);
      const cookie = cookies[0];
      expect(cookie).toBeDefined();
      expect(cookie.length).toBeGreaterThan(1);
      const token = cookie.split(';')[0].split('=')[1];
      const req = {
        cookies: {
          Authorization: token,
        },
      };
      const next: NextFunction = jest.fn();
      await setIdentity(req as any, {} as any, next);
      expect((req as RequestWithIdentity).identity.userUuid).toEqual(userLoggedIn.uuid);
      expect((req as RequestWithIdentity).identity.hasPermissionToEditUserProfile()).toBeTruthy();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('when exist more then one user with same login', () => {
    it('POST /login should respond with a status code of 400 when exist more then one user with same phone', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const login = user1.phone;
      user2.phone = login;
      expect(user1.phone).toBe(user2.phone);
      expect(user1.email).not.toBe(user2.email);

      const createUser1Response = await request(app.getServer()).post(usersRoute.path).send(user1).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message } = createUser1Response.body;
      expect(newUser1Dto?.uuid).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.phone).toBe(login);

      const createUser2Response = await request(app.getServer()).post(usersRoute.path).send(user2).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message } = createUser2Response.body;
      expect(newUser2Dto?.uuid).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.phone).toBe(login);

      expect(newUser1Dto.phone).toBe(newUser2Dto.phone);

      const loginData: LoginDto = { login: user1.phone, password: user1.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(error_keys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      let deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser1Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser2Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('POST /login should respond with a status code of 400 when exist more then one user with same email', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const login = user1.email;
      user2.email = login;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(usersRoute.path).send(user1).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message } = createUser1Response.body;
      expect(newUser1Dto?.uuid).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(login);

      const createUser2Response = await request(app.getServer()).post(usersRoute.path).send(user2).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message } = createUser2Response.body;
      expect(newUser2Dto?.uuid).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(login);

      expect(newUser1Dto.email).toBe(newUser1Dto.email);

      const loginData: LoginDto = { login: login, password: user1.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(error_keys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      let deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser1Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser2Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });
  });

  describe('when login data are invalid', () => {
    it('POST /login should respond with a status code of 400 when login is invalid', async () => {
      const model = <LoginDto>{ password: 'strongPassword1@' };

      const bodyData = [<LoginDto>{ ...model, login: null }, <LoginDto>{ ...model, login: undefined }, <LoginDto>{ ...model, login: '' }];

      for (const body of bodyData) {
        const response = await request(app.getServer()).post(authRoute.loginPath).send(body);
        expect(response.statusCode).toBe(400);
        const errors = (<string>response.body.data.message)?.split(',');
        expect(errors.filter(x => x.indexOf('Login') === -1).length).toBe(0);
      }
    });

    it('POST /login should respond with a status code of 400 when password is invalid', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const model = <LoginDto>{ login: user.email };

      const bodyData = [
        <LoginDto>{ ...model, password: null },
        <LoginDto>{ ...model, password: undefined },
        <LoginDto>{ ...model, password: '' },
        <LoginDto>{ ...model, password: 'V3ry looooooooooooooooooooong passwooooooooooord!12' },
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer()).post(authRoute.loginPath).send(body);
        expect(response.statusCode).toBe(400);
        const errors = (<string>response.body.data.message)?.split(',');
        expect(errors.filter(x => x.indexOf('Password') === -1).length).toBe(0);
      }

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('POST /login should respond with a status code of 400 when user with given email not exist', async () => {
      const user = generateValidUser();
      const loginData: LoginDto = { login: user.email, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(error_keys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();
    });

    it('POST /login should respond with a status code of 400 when user with given phone not exist', async () => {
      const user = generateValidUser();
      const loginData: LoginDto = { login: user.phone, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(error_keys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();
    });

    it('POST /login (via email) should respond with a status code of 400 when password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const loginData: LoginDto = { login: newUserDto.email, password: 'some_different_P@ssword!' };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(error_keys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('POST /login (via phone) should respond with a status code of 400 when password is incorrect', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const loginData: LoginDto = { login: newUserDto.phone, password: 'some_different_P@ssword!' };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(error_keys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });
  });

  describe('when user is not active', () => {
    it('POST /login should respond with a status code of 400 when user is not active', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user).set('Authorization', `Bearer ${adminAuthToken}`);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deactivateResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUserDto.uuid + '/' + usersRoute.deactivatePath)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deactivateResponse.statusCode).toBe(200);

      const loginData: LoginDto = { login: newUserDto.email, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(error_keys.login.User_Is_Not_Active);
      expect(loginArgs).toBeUndefined();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAuthToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });
  });

  describe('when user is deleted', () => {
    it('POST /login should respond with a status code of 400 when user is deleted', async () => {
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

      const loginData: LoginDto = { login: newUserDto.email, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = loginResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
      expect(loginMessage).toBe(error_keys.login.Invalid_Login_Or_Password);
      expect(loginArgs).toBeUndefined();
    });
  });
});
