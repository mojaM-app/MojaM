/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { AuthRoute, LoginDto, ResetPasswordResponseDto, UserWhoLogsIn } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, UserRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { registerTestEventHandlers } from '@utils/tests-events.utils';
import { generateRandomEmail, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';

describe('POST /auth/request-reset-password', () => {
  const userRouter = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([userRouter, permissionsRoute]);
  let adminAccessToken: string | undefined;
  let mockSendMail: any;

  beforeAll(async () => {
    const { email, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    mockSendMail = jest.fn().mockImplementation((mailoptions: any, callback: (error: any, info: any) => void) => {
      callback(null, null);
    });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
      close: jest.fn().mockImplementation(() => {}),
    } as any);
  });

  describe('when login data are valid (given email is unique, not exist or is empty)', () => {
    it('when exist only one user with given e-mail and user password is set', async () => {
      const { email } = getAdminLoginData();
      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      const body: ResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('when exist only one user with given e-mail and user password is NOT set', async () => {
      const user = generateValidUser();
      user.password = undefined;

      const createUser1Response = await request(app.getServer()).post(userRouter.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(user.email);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUser1Dto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: newUser1Dto.email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      const body: ResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('when NO user with given e-mail', async () => {
      const email = generateRandomEmail();
      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      const body: ResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);
    });

    it('when e-mail empty or null', async () => {
      const testData: any[] = [null, ''];

      for (const email of testData) {
        const response = await request(app.getServer())
          .post(authRoute.requestResetPasswordPath)
          .send({ email } satisfies UserWhoLogsIn);
        expect(response.statusCode).toBe(200);
        const body: ResetPasswordResponseDto = response.body;
        expect(typeof body).toBe('object');
        expect(body.data).toBe(true);

        expect(mockSendMail).toHaveBeenCalledTimes(0);
      }
    });

    it('email is sent only once when token is still valid (not expired)', async () => {
      const user = generateValidUser();
      user.password = undefined;

      const createUser1Response = await request(app.getServer()).post(userRouter.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(user.email);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUser1Dto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      let response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: user.email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      let body: ResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: user.email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });
  });

  describe('when login data are invalid (given email is NOT unique)', () => {
    it('when exist more then one user with given email and both are activated', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRouter.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUser1Dto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRouter.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUser2Dto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      const body: ResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

      let deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one user with given email and only one is activated', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRouter.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUser1Dto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRouter.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      const body: ResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

      let deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one user with given email and NO one is activated', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRouter.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      const createUser2Response = await request(app.getServer()).post(userRouter.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      const body: ResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

      let deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one user with given email and only one has set password', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      user2.password = undefined;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRouter.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUser1Dto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRouter.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUser2Dto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      const body: ResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

      let deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one user with given email and NO one has set password', async () => {
      const user1 = generateValidUser();
      user1.password = undefined;
      const user2 = generateValidUser();
      user2.password = undefined;
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRouter.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUser1Dto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRouter.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app.getServer())
        .post(userRouter.path + '/' + newUser2Dto.id + '/' + userRouter.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserWhoLogsIn);
      expect(response.statusCode).toBe(200);
      const body: ResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

      let deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRouter.path + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
