import { AuthenticationTypes, ILoginModel, RouteConstants, events } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { generateRandomEmail, getAdminLoginData } from '@utils';
import request from 'supertest';
import { AccountTryingToLogInDto, GetAccountBeforeLogInResponseDto, IGetAccountBeforeLogInResultDto } from '../dtos/get-account-before-log-in.dto';
import { AuthRoute } from '../routes/auth.routes';
import { TestApp } from './../../../helpers/tests.utils';

describe('POST /auth/get-account-before-log-in', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await testHelpers.loginAs(app, { email, passcode } satisfies ILoginModel))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('when login data are valid (given email is unique or not exist)', () => {
    it('when exist only one activated user with given e-mail and user passcode is set', async () => {
      const { email } = getAdminLoginData();
      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: true, authType: AuthenticationTypes.Password } satisfies IGetAccountBeforeLogInResultDto);
    });

    it('when exist only one activated user with given e-mail and user passcode is NOT set', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      user.passcode = undefined;

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUserDto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(400);

      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isActive: false,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist only one NOT-activated user with given e-mail and user passcode is NOT set', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      user.passcode = undefined;

      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(400);

      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isActive: false,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist only one NOT-activated user with given e-mail and user passcode is set', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUser1Response.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isActive: false,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: false,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when NO user with given e-mail', async () => {
      const email = generateRandomEmail();
      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: true, authType: AuthenticationTypes.Password } satisfies IGetAccountBeforeLogInResultDto);
    });
  });

  describe('when login data are invalid (eg. given email is NOT unique)', () => {
    it('when exist more then one user with given email and both are activated', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      const user2 = userTestHelpers.generateValidUserWithPassword();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser1Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser2Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one user with given email and only one is activated', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      const user2 = userTestHelpers.generateValidUserWithPassword();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      const activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser1Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one user with given email and NO one is activated', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      const user2 = userTestHelpers.generateValidUserWithPassword();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one activated users with given email and only one has set passcode', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      const user2 = userTestHelpers.generateValidUserWithPassword();
      const email = user1.email;
      user2.email = email;
      user2.passcode = undefined;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser1Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser2Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(400);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one activated users with given email and one has set passcode and another has set pin', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      const user2 = userTestHelpers.generateValidUserWithPin();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser1Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser2Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one activated users with given email and NO one has set passcode', async () => {
      const user1 = userTestHelpers.generateValidUserWithPassword();
      user1.passcode = undefined;
      const user2 = userTestHelpers.generateValidUserWithPassword();
      user2.passcode = undefined;
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.id).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser1Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(400);

      const createUser2Response = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.id).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUser2Dto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(400);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app!.getServer())
        .post(AuthRoute.getAccountBeforeLogInPath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: GetAccountBeforeLogInResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(typeof body.data).toBe('object');
      expect(body.data).toStrictEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isPhoneRequired: true } satisfies IGetAccountBeforeLogInResultDto);

      let deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser1Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUser2Dto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when e-mail empty or null', async () => {
      const testData: any[] = [null, ''];

      for (const email of testData) {
        const response = await request(app!.getServer())
          .post(AuthRoute.getAccountBeforeLogInPath)
          .send({ email } satisfies AccountTryingToLogInDto);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => x !== errorKeys.users.Invalid_Email).length).toBe(0);
      }
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
