/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { AuthRoute, GetUserInfoBeforeLogInResponseDto, IUserInfoBeforeLogInResultDto, LoginDto, UserTryingToLogInDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, UserRoute } from '@modules/users';
import { generateRandomEmail, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';

describe('POST /auth/get-user-who-logs-in', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let mockSendMail: any;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute]);
    const { email, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    mockSendMail = jest.fn().mockImplementation((mailOptions: any, callback: (error: any, info: any) => void) => {
      callback(null, null);
    });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
      close: jest.fn().mockImplementation(() => {}),
    } as any);
  });

  describe('when login data are valid (given email is unique or not exist)', () => {
    it('when exist only one activated user with given e-mail and user password is set', async () => {
      const { email } = getAdminLoginData();
      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isPasswordSet: true,
        isActive: true,
      } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({ isPasswordSet: true, isActive: true } satisfies IUserInfoBeforeLogInResultDto);
    });

    it('when exist only one activated user with given e-mail and user password is NOT set', async () => {
      const user1 = generateValidUser();
      user1.password = undefined;

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(user1.email);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser1Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email: newUser1Dto.email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isPasswordSet: false,
        isActive: true,
      } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({ isPasswordSet: false, isActive: true } satisfies IUserInfoBeforeLogInResultDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist only one NOT-activated user with given e-mail and user password is NOT set', async () => {
      const user = generateValidUser();
      user.password = undefined;

      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email: newUserDto.email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isPasswordSet: false,
        isActive: false,
      } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({ isPasswordSet: false, isActive: false } satisfies IUserInfoBeforeLogInResultDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist only one NOT-activated user with given e-mail and user password is set', async () => {
      const user = generateValidUser();

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUser1Response.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email: newUserDto.email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isPasswordSet: true,
        isActive: false,
      } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({
        isPasswordSet: true,
        isActive: false,
      } satisfies IUserInfoBeforeLogInResultDto);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when NO user with given e-mail', async () => {
      const email = generateRandomEmail();
      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isPasswordSet: true,
        isActive: true,
      } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({ isPasswordSet: true, isActive: true } satisfies IUserInfoBeforeLogInResultDto);
    });
  });

  describe('when login data are invalid (eg. given email is NOT unique)', () => {
    it('when exist more then one user with given email and both are activated', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser1Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser2Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser2Dto.id)
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

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser1Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser2Dto.id)
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

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      const createUser2Response = await request(app.getServer()).post(userRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one activated users with given email and only one has set password', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      user2.password = undefined;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser1Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser2Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one activated users with given email and NO one has set password', async () => {
      const user1 = generateValidUser();
      user1.password = undefined;
      const user2 = generateValidUser();
      user2.password = undefined;
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(userRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser1Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(userRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUser2Dto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.getUserInfoBeforeLogInPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetUserInfoBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IUserInfoBeforeLogInResultDto);

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when e-mail empty or null', async () => {
      const testData: any[] = [null, ''];

      for (const email of testData) {
        const response = await request(app.getServer())
          .post(authRoute.getUserInfoBeforeLogInPath)
          .send({ email } satisfies UserTryingToLogInDto);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => x !== errorKeys.users.Invalid_Email).length).toBe(0);
      }
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
