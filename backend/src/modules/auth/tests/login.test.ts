import { App } from '@/app';
import { events } from '@events/events';
import { error_keys } from '@exceptions/error.keys';
import { AuthRoute } from '@modules/auth/auth.routes';
import { IUser } from '@modules/users/interfaces/IUser';
import { generateValidUser } from '@modules/users/tests/user-tests.helpers';
import { UsersRoute } from '@modules/users/users.routes';
import { NextFunction } from 'express';
import request from 'supertest';
import { LoginDto } from '../dtos/login.dto';
import { RequestWithUser } from '../interfaces/RequestWithUser';
import { verifyToken } from '../middlewares/auth.middleware';

describe('POST /login', () => {
  const usersRoute = new UsersRoute();
  const authRoute = new AuthRoute();
  const app = new App([usersRoute, authRoute]);

  describe('when login data are valid', () => {
    it('(login via phone and password) response should have the Set-Cookie header with the Authorization token when login data are correct', async () => {
      const user = generateValidUser();
      const login = user.phone;
      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user);
      let body = createResponse.body;
      expect(typeof body).toBe('object');
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage, args: createArgs } = body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);
      expect(createArgs).toBeUndefined();

      const loginData: LoginDto = { login: login, password: user.password };
      const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
      body = loginResponse.body;
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
      await verifyToken(req as any, {} as any, next);
      expect((req as RequestWithUser).user.uuid).toEqual(newUserDto.uuid);
      expect(next).toHaveBeenCalled();

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + userLoggedIn.uuid)
        .send();
      expect(deleteResponse.statusCode).toBe(200);
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

      const createUser1Response = await request(app.getServer()).post(usersRoute.path).send(user1);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message } = createUser1Response.body;
      expect(newUser1Dto?.uuid).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.phone).toBe(login);

      const createUser2Response = await request(app.getServer()).post(usersRoute.path).send(user2);
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
      const { message: deleteMessage, args: deleteArgs }: { message: string; args: string[] } = data;
      expect(deleteMessage).toBe(error_keys.users.login.Invalid_Login_Or_Password);
      expect(deleteArgs).toBeUndefined();

      let deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser1Dto.uuid)
        .send();
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser2Dto.uuid)
        .send();
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('POST /login should respond with a status code of 400 when exist more then one user with same email', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const login = user1.email;
      user2.email = login;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(usersRoute.path).send(user1);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message } = createUser1Response.body;
      expect(newUser1Dto?.uuid).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(login);

      const createUser2Response = await request(app.getServer()).post(usersRoute.path).send(user2);
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
      const { message: deleteMessage, args: deleteArgs }: { message: string; args: string[] } = data;
      expect(deleteMessage).toBe(error_keys.users.login.Invalid_Login_Or_Password);
      expect(deleteArgs).toBeUndefined();

      let deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser1Dto.uuid)
        .send();
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser2Dto.uuid)
        .send();
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

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user);
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
        .send();
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
      const { message: deleteMessage, args: deleteArgs }: { message: string; args: string[] } = data;
      expect(deleteMessage).toBe(error_keys.users.login.Invalid_Login_Or_Password);
      expect(deleteArgs).toBeUndefined();
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
      const { message: deleteMessage, args: deleteArgs }: { message: string; args: string[] } = data;
      expect(deleteMessage).toBe(error_keys.users.login.Invalid_Login_Or_Password);
      expect(deleteArgs).toBeUndefined();
    });
  });
});
