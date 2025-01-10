/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import {
  AuthRoute,
  LoginDto,
  RequestResetPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  UserTryingToLogInDto,
} from '@modules/auth';
import { EmailService } from '@modules/notifications';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, IUser, UserRoute } from '@modules/users';
import { generateRandomEmail, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';

describe('POST /auth/request-reset-password', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let adminAccessToken: string | undefined;
  let mockSendMail: any;
  let originalSendEmailResetPassword: (user: IUser, link: string) => Promise<boolean>;

  beforeAll(async () => {
    const emailService = new EmailService();
    originalSendEmailResetPassword = emailService.sendEmailResetPassword.bind(emailService);

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

  describe('when login data are invalid (given email is NOT unique, is empty or invalid)', () => {
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
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

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
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

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
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

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

    it('when exist more then one user with given email and only one has a password set', async () => {
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
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

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

    it('when exist more then one user with given email and NO one has a password set', async () => {
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
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(0);

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

    it('when e-mail is empty or null', async () => {
      const testData: any[] = [null, ''];

      for (const email of testData) {
        const response = await request(app.getServer())
          .post(authRoute.requestResetPasswordPath)
          .send({ email } satisfies UserTryingToLogInDto);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => x !== errorKeys.users.Invalid_Email).length).toBe(0);

        expect(mockSendMail).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('when login data are valid (given email is unique, not exist, etc.)', () => {
    it('when exist only one active user with given e-mail and user password is NOT set', async () => {
      const user = generateValidUser();
      user.password = undefined;

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

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: newUserDto.email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('when exist only one inactive user with given e-mail and user password is NOT set', async () => {
      const user = generateValidUser();
      user.password = undefined;

      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      const response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: newUserDto.email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const body: RequestResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('when NO user with given e-mail (or email is invalid)', async () => {
      const testData: any[] = [generateRandomEmail(), ' ', 'not-email', 'not-email@', 'not-email@domain', 'not-email@domain.', 'not-email@.com'];
      for (const email of testData) {
        const response = await request(app.getServer())
          .post(authRoute.requestResetPasswordPath)
          .send({ email } satisfies UserTryingToLogInDto);
        expect(response.statusCode).toBe(200);
        const body: RequestResetPasswordResponseDto = response.body;
        expect(typeof body).toBe('object');
        expect(body.data).toBe(true);

        expect(mockSendMail).toHaveBeenCalledTimes(0);
      }
    });

    it('email is sent only once when token is still valid (not expired)', async () => {
      const user = generateValidUser();
      user.password = undefined;

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
        .post(authRoute.requestResetPasswordPath)
        .send({ email: user.email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      let body: RequestResetPasswordResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: user.email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist only one user (via e-mail) and user password is set', async () => {
      let url = '';
      const mockSendEmailResetPassword = jest.fn().mockImplementation(async (user: IUser, link: string) => {
        url = link;
        return await originalSendEmailResetPassword(user, link);
      });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPassword').mockImplementation(mockSendEmailResetPassword);

      const { email, uuid: userId, password } = getAdminLoginData();
      let response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const resetPasswordBody: RequestResetPasswordResponseDto = response.body;
      expect(typeof resetPasswordBody).toBe('object');
      expect(resetPasswordBody.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(7);
      expect(splittedUrl[0]).toBe('http:');
      expect(splittedUrl[1]).toBe('');
      expect(splittedUrl[2]).toBe('localhost:4200');
      expect(splittedUrl[3]).toBe('#');
      expect(splittedUrl[4]).toBe('reset-password');
      expect(splittedUrl[5].length).toBe(36); // UUID v4
      expect(splittedUrl[5]).toBe(userId);
      expect(splittedUrl[6].length).toBe(64);

      const token = splittedUrl[6];

      response = await request(app.getServer())
        .post(authRoute.resetPasswordPath)
        .send({ userId, token, password } satisfies ResetPasswordDto);
      expect(response.statusCode).toBe(200);

      const resetPasswordResultBody: ResetPasswordResponseDto = response.body;
      expect(typeof resetPasswordResultBody).toBe('object');
      const { data, message }: ResetPasswordResponseDto = resetPasswordResultBody;
      expect(data.isPasswordSet).toBe(true);
      expect(message).toBe(events.users.userPasswordChanged);

      expect(mockSendEmailResetPassword).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserPasswordChanged].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserPasswordChanged).toHaveBeenCalledTimes(1);
    });

    it('when exist only one user (via e-mail and phone) and user password is set', async () => {
      let url = '';
      const mockSendEmailResetPassword = jest.fn().mockImplementation(async (user: IUser, link: string) => {
        url = link;
        return await originalSendEmailResetPassword(user, link);
      });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPassword').mockImplementation(mockSendEmailResetPassword);

      const user = generateValidUser();
      user.email = getAdminLoginData().email;
      expect(user.phone).not.toBe(getAdminLoginData().phone);

      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createUserMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createUserMessage).toBe(events.users.userCreated);
      expect(newUserDto.email).toBe(user.email);

      let response = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: user.email, phone: user.phone } satisfies UserTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      const resetPasswordBody: RequestResetPasswordResponseDto = response.body;
      expect(typeof resetPasswordBody).toBe('object');
      expect(resetPasswordBody.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(7);
      expect(splittedUrl[0]).toBe('http:');
      expect(splittedUrl[1]).toBe('');
      expect(splittedUrl[2]).toBe('localhost:4200');
      expect(splittedUrl[3]).toBe('#');
      expect(splittedUrl[4]).toBe('reset-password');
      expect(splittedUrl[5].length).toBe(36); // UUID v4
      expect(splittedUrl[5]).toBe(newUserDto.id);
      expect(splittedUrl[6].length).toBe(64);

      const token = splittedUrl[6];

      response = await request(app.getServer())
        .post(authRoute.resetPasswordPath)
        .send({ userId: newUserDto.id, token, password: user.password } satisfies ResetPasswordDto);
      expect(response.statusCode).toBe(200);

      const resetPasswordResultBody: ResetPasswordResponseDto = response.body;
      expect(typeof resetPasswordResultBody).toBe('object');
      const { data, message }: ResetPasswordResponseDto = resetPasswordResultBody;
      expect(data.isPasswordSet).toBe(true);
      expect(message).toBe(events.users.userPasswordChanged);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      expect(mockSendEmailResetPassword).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserPasswordChanged, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserPasswordChanged).toHaveBeenCalledTimes(1);
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
