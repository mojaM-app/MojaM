/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUserWithPassword, loginAs } from '@helpers/user-tests.helpers';
import {
  AccountTryingToLogInDto,
  AuthRoute,
  LoginDto,
  RequestResetPasscodeResponseDto,
  ResetPasscodeDto,
  ResetPasscodeResponseDto,
} from '@modules/auth';
import { EmailService, IResetPasscodeEmailSettings } from '@modules/notifications';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, UserRoute } from '@modules/users';
import { generateRandomEmail, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';

describe('POST /auth/request-reset-passcode', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let adminAccessToken: string | undefined;
  let mockSendMail: any;
  let sendWelcomeEmailSpy: any;
  let originalSendEmailResetPasscode: (settings: IResetPasscodeEmailSettings) => Promise<boolean>;

  beforeAll(async () => {
    const emailService = new EmailService();
    originalSendEmailResetPasscode = emailService.sendEmailResetPasscode.bind(emailService);

    await app.initialize([userRoute, permissionsRoute]);
    const { email, passcode } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, passcode } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.restoreAllMocks();

    mockSendMail = jest.fn().mockImplementation((mailOptions: any, callback: (error: any, info: any) => void) => {
      callback(null, null);
    });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
      close: jest.fn().mockImplementation(() => {}),
    } as any);

    sendWelcomeEmailSpy = jest.spyOn(EmailService.prototype, 'sendWelcomeEmail');
  });

  describe('when login data are invalid (given email is NOT unique, is empty or invalid)', () => {
    it('when exist more then one user with given email and both are activated', async () => {
      const user1 = generateValidUserWithPassword();
      const user2 = generateValidUserWithPassword();
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
        .post(authRoute.requestResetPasscodePath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasscodeResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenCalledTimes(2);

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
      const user1 = generateValidUserWithPassword();
      const user2 = generateValidUserWithPassword();
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
        .post(authRoute.requestResetPasscodePath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasscodeResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenCalledTimes(2);

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
      const user1 = generateValidUserWithPassword();
      const user2 = generateValidUserWithPassword();
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
        .post(authRoute.requestResetPasscodePath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasscodeResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenCalledTimes(2);

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

    it('when exist more then one user with given email and only one has a passcode set', async () => {
      const user1 = generateValidUserWithPassword();
      const user2 = generateValidUserWithPassword();
      const email = user1.email;
      user2.email = email;
      user2.passcode = undefined;
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
      expect(activateNewUserResponse.statusCode).toBe(400);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasscodeResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenCalledTimes(2);

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

    it('when exist more then one user with given email and NO one has a passcode set', async () => {
      const user1 = generateValidUserWithPassword();
      user1.passcode = undefined;
      const user2 = generateValidUserWithPassword();
      user2.passcode = undefined;
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
      expect(activateNewUserResponse.statusCode).toBe(400);

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
      expect(activateNewUserResponse.statusCode).toBe(400);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasscodeResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(2);
      expect(mockSendMail).toHaveBeenCalledTimes(2);

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

    it('when e-mail is empty or null or not-string', async () => {
      const testData: any[] = [null, '', ' ', true, undefined, 0, {}, []];

      for (const email of testData) {
        const response = await request(app.getServer())
          .post(authRoute.requestResetPasscodePath)
          .send({ email } satisfies AccountTryingToLogInDto);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => x !== errorKeys.users.Invalid_Email).length).toBe(0);

        expect(mockSendMail).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('when login data are valid (given email is unique, not exist, etc.)', () => {
    it('RequestResetPasscode email should not be sent when exist only one active user with given e-mail and user passcode is NOT set', async () => {
      const user = generateValidUserWithPassword();
      user.passcode = undefined;

      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(400);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasscodeResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('RequestResetPasscode email should not be sent when exist only one inactive user with given e-mail and user passcode is NOT set', async () => {
      const user = generateValidUserWithPassword();
      user.passcode = undefined;

      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(400);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasscodeResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('when NO user with given e-mail (or email is invalid)', async () => {
      const testData: any[] = [generateRandomEmail(), 'not-email', 'not-email@', 'not-email@domain', 'not-email@domain.', 'not-email@.com'];
      for (const email of testData) {
        const response = await request(app.getServer())
          .post(authRoute.requestResetPasscodePath)
          .send({ email } satisfies AccountTryingToLogInDto);
        expect(response.statusCode).toBe(200);
        const body: RequestResetPasscodeResponseDto = response.body;
        expect(typeof body).toBe('object');
        expect(body.data).toBe(true);

        expect(mockSendMail).toHaveBeenCalledTimes(0);
      }
    });

    it('RequestResetPasscode email should not be sent when user passcode is not set', async () => {
      const user = generateValidUserWithPassword();
      user.passcode = undefined;

      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(400);

      let response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email: user.email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      let body: RequestResetPasscodeResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email: user.email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('email is sent only once when token is still valid (not expired)', async () => {
      const user = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      let response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email: user.email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      let body: RequestResetPasscodeResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email: user.email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(2);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist only one user (via e-mail) and user password is set', async () => {
      let url = '';
      const mockSendEmailResetPasscode = jest.fn().mockImplementation(async (settings: IResetPasscodeEmailSettings) => {
        url = settings.link;
        return await originalSendEmailResetPasscode(settings);
      });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPasscode').mockImplementation(mockSendEmailResetPasscode);

      const { email, uuid: userId, passcode } = getAdminLoginData();
      let response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const resetPasscodeBody: RequestResetPasscodeResponseDto = response.body;
      expect(typeof resetPasscodeBody).toBe('object');
      expect(resetPasscodeBody.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(8);
      expect(splittedUrl[0]).toBe('http:');
      expect(splittedUrl[1]).toBe('');
      expect(splittedUrl[2]).toBe('localhost:4200');
      expect(splittedUrl[3]).toBe('#');
      expect(splittedUrl[4]).toBe('account');
      expect(splittedUrl[5].length).toBe(36); // UUID v4
      expect(splittedUrl[5]).toBe(userId);
      expect(splittedUrl[6]).toBe('reset-passcode');
      expect(splittedUrl[7].length).toBe(64);

      const token = splittedUrl[splittedUrl.length - 1];

      response = await request(app.getServer())
        .post(authRoute.resetPasscodePath + `/${userId}`)
        .send({ token, passcode } satisfies ResetPasscodeDto);
      expect(response.statusCode).toBe(200);

      const resetPasscodeResultBody: ResetPasscodeResponseDto = response.body;
      expect(typeof resetPasscodeResultBody).toBe('object');
      const { data, message }: ResetPasscodeResponseDto = resetPasscodeResultBody;
      expect(data.isPasscodeSet).toBe(true);
      expect(message).toBe(events.users.userPasscodeChanged);

      expect(mockSendEmailResetPasscode).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserPasscodeChanged].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserPasscodeChanged).toHaveBeenCalledTimes(1);
    });

    it('when exist only one user (via e-mail and phone) and user password is set', async () => {
      let url = '';
      const mockSendEmailResetPasscode = jest.fn().mockImplementation(async (settings: IResetPasscodeEmailSettings) => {
        url = settings.link;
        return await originalSendEmailResetPasscode(settings);
      });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPasscode').mockImplementation(mockSendEmailResetPasscode);

      const user = generateValidUserWithPassword();
      user.email = getAdminLoginData().email;
      expect(user.phone).not.toBe(getAdminLoginData().phone);

      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      let response = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email: user.email, phone: user.phone } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const resetPasscodeBody: RequestResetPasscodeResponseDto = response.body;
      expect(typeof resetPasscodeBody).toBe('object');
      expect(resetPasscodeBody.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(8);
      expect(splittedUrl[0]).toBe('http:');
      expect(splittedUrl[1]).toBe('');
      expect(splittedUrl[2]).toBe('localhost:4200');
      expect(splittedUrl[3]).toBe('#');
      expect(splittedUrl[4]).toBe('account');
      expect(splittedUrl[5].length).toBe(36); // UUID v4
      expect(splittedUrl[5]).toBe(newUserDto.id);
      expect(splittedUrl[6]).toBe('reset-passcode');
      expect(splittedUrl[7].length).toBe(64);

      const token = splittedUrl[splittedUrl.length - 1];

      response = await request(app.getServer())
        .post(authRoute.resetPasscodePath + `/${newUserDto.id}`)
        .send({ token, passcode: user.passcode! } satisfies ResetPasscodeDto);
      expect(response.statusCode).toBe(200);

      const resetPasscodeResultBody: ResetPasscodeResponseDto = response.body;
      expect(typeof resetPasscodeResultBody).toBe('object');
      const { data, message }: ResetPasscodeResponseDto = resetPasscodeResultBody;
      expect(data.isPasscodeSet).toBe(true);
      expect(message).toBe(events.users.userPasscodeChanged);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      expect(mockSendEmailResetPasscode).toHaveBeenCalledTimes(1);
      expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(2);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserPasscodeChanged, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserPasscodeChanged).toHaveBeenCalledTimes(1);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });
});
