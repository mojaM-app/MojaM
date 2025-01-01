/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { RESET_PASSWORD_TOKEN_EXPIRE_IN } from '@config';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import {
  AuthRoute,
  CheckResetPasswordTokenResponseDto,
  LockedUserTriesToLogInEvent,
  LoginDto,
  RequestResetPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  UserLoggedInEvent,
  UserPasswordChangedEvent,
  UserTryingToLogInDto,
} from '@modules/auth';
import { EmailService } from '@modules/notifications';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, IUserDto, UserRoute } from '@modules/users';
import * as Utils from '@utils';
import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@utils/constants';
import { generateRandomPassword, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import ms from 'ms';
import nodemailer from 'nodemailer';
import request from 'supertest';

describe('POST /auth/reset-password', () => {
  const userRoute = new UserRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();
  let adminAccessToken: string | undefined;
  let mockSendMail: any;
  let originalSendEmailResetPassword: (user: { firstName: string; lastName: string; email: string }, link: string) => Promise<boolean>;

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

  describe('when reset password data are valid', () => {
    it('when user is inactive, after reset password user should be active and should be able to log in', async () => {
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      let url = '';
      const mockSendEmailResetPassword = jest
        .fn()
        .mockImplementation(async (user: { firstName: string; lastName: string; email: string }, link: string) => {
          url = link;
          return await originalSendEmailResetPassword(user, link);
        });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPassword').mockImplementation(mockSendEmailResetPassword);

      const requestResetPasswordResponse = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: newUserDto.email } satisfies UserTryingToLogInDto);
      expect(requestResetPasswordResponse.statusCode).toBe(200);
      let body: RequestResetPasswordResponseDto | ResetPasswordResponseDto | CheckResetPasswordTokenResponseDto =
        requestResetPasswordResponse.body as RequestResetPasswordResponseDto;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(7);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const checkResetPasswordTokenResponse = await request(app.getServer())
        .post(authRoute.checkResetPasswordTokenPath + '/' + newUserDto.id + '/' + token)
        .send();
      expect(checkResetPasswordTokenResponse.statusCode).toBe(200);
      body = checkResetPasswordTokenResponse.body as CheckResetPasswordTokenResponseDto;
      expect(typeof body).toBe('object');
      const { data: checkResetPasswordTokenResult } = body;
      expect(checkResetPasswordTokenResult.isValid).toBe(true);
      expect(checkResetPasswordTokenResult.userEmail).toBe(newUserDto.email);

      const newPassword = generateRandomPassword();
      const resetPasswordDto = {
        userId: newUserDto.id,
        token,
        password: newPassword,
      } satisfies ResetPasswordDto;
      const resetPasswordResponse = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(resetPasswordResponse.statusCode).toBe(200);
      body = resetPasswordResponse.body as ResetPasswordResponseDto;
      expect(typeof body).toBe('object');
      const { data: resetPasswordResult, message: resetPasswordMessage } = body;
      expect(resetPasswordMessage).toBe(events.users.userPasswordChanged);
      expect(resetPasswordResult.isPasswordSet).toBe(true);

      const newUserAccessToken = (await loginAs(app, { email: newUserDto.email, password: newPassword } satisfies LoginDto))?.accessToken;
      expect(newUserAccessToken).toBeDefined();
      expect(newUserAccessToken!.length).toBeGreaterThan(1);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserPasswordChanged,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });

      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserPasswordChanged).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);

      expect(testEventHandlers.onUserPasswordChanged).toHaveBeenCalledWith(
        new UserPasswordChangedEvent({
          id: newUserDto.id,
          email: newUserDto.email,
          phone: newUserDto.phone,
        } satisfies IUserDto),
      );
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledWith(
        new UserLoggedInEvent({
          id: newUserDto.id,
          email: newUserDto.email,
          phone: newUserDto.phone,
        } satisfies IUserDto),
      );
    });

    it('when user is active, after reset password user should be active and should be able to log in', async () => {
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      let url = '';
      const mockSendEmailResetPassword = jest
        .fn()
        .mockImplementation(async (user: { firstName: string; lastName: string; email: string }, link: string) => {
          url = link;
          return await originalSendEmailResetPassword(user, link);
        });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPassword').mockImplementation(mockSendEmailResetPassword);

      const requestResetPasswordResponse = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: newUserDto.email } satisfies UserTryingToLogInDto);
      expect(requestResetPasswordResponse.statusCode).toBe(200);
      let body: RequestResetPasswordResponseDto | ResetPasswordResponseDto | CheckResetPasswordTokenResponseDto =
        requestResetPasswordResponse.body as RequestResetPasswordResponseDto;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(7);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const checkResetPasswordTokenResponse = await request(app.getServer())
        .post(authRoute.checkResetPasswordTokenPath + '/' + newUserDto.id + '/' + token)
        .send();
      expect(checkResetPasswordTokenResponse.statusCode).toBe(200);
      body = checkResetPasswordTokenResponse.body as CheckResetPasswordTokenResponseDto;
      expect(typeof body).toBe('object');
      const { data: checkResetPasswordTokenResult } = body;
      expect(checkResetPasswordTokenResult.isValid).toBe(true);
      expect(checkResetPasswordTokenResult.userEmail).toBe(newUserDto.email);

      const newPassword = generateRandomPassword();
      const resetPasswordDto = {
        userId: newUserDto.id,
        token,
        password: newPassword,
      } satisfies ResetPasswordDto;
      const resetPasswordResponse = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(resetPasswordResponse.statusCode).toBe(200);
      body = resetPasswordResponse.body as ResetPasswordResponseDto;
      expect(typeof body).toBe('object');
      const { data: resetPasswordResult, message: resetPasswordMessage } = body;
      expect(resetPasswordMessage).toBe(events.users.userPasswordChanged);
      expect(resetPasswordResult.isPasswordSet).toBe(true);

      const newUserAccessToken = (await loginAs(app, { email: newUserDto.email, password: newPassword } satisfies LoginDto))?.accessToken;
      expect(newUserAccessToken).toBeDefined();
      expect(newUserAccessToken!.length).toBeGreaterThan(1);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserPasswordChanged,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });

      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserPasswordChanged).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);

      expect(testEventHandlers.onUserPasswordChanged).toHaveBeenCalledWith(
        new UserPasswordChangedEvent({
          id: newUserDto.id,
          email: newUserDto.email,
          phone: newUserDto.phone,
        } satisfies IUserDto),
      );
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledWith(
        new UserLoggedInEvent({
          id: newUserDto.id,
          email: newUserDto.email,
          phone: newUserDto.phone,
        } satisfies IUserDto),
      );
    });

    it('when user is lockedOut, after reset password user should be active and should stay lockedOut (should not be able to log in)', async () => {
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: LoginDto = { email: newUserDto.email, phone: newUserDto.phone, password: user.password + 'invalid_password' };
      for (let index = 1; index <= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        const body = loginResponse.body;
        expect(typeof body).toBe('object');
        const data = body.data;
        const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Password);
        expect(loginArgs).toBeUndefined();
      }

      let url = '';
      const mockSendEmailResetPassword = jest
        .fn()
        .mockImplementation(async (user: { firstName: string; lastName: string; email: string }, link: string) => {
          url = link;
          return await originalSendEmailResetPassword(user, link);
        });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPassword').mockImplementation(mockSendEmailResetPassword);

      const requestResetPasswordResponse = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: newUserDto.email } satisfies UserTryingToLogInDto);
      expect(requestResetPasswordResponse.statusCode).toBe(200);
      let body: RequestResetPasswordResponseDto | ResetPasswordResponseDto | CheckResetPasswordTokenResponseDto | TranslatableHttpException =
        requestResetPasswordResponse.body as RequestResetPasswordResponseDto;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(7);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const checkResetPasswordTokenResponse = await request(app.getServer())
        .post(authRoute.checkResetPasswordTokenPath + '/' + newUserDto.id + '/' + token)
        .send();
      expect(checkResetPasswordTokenResponse.statusCode).toBe(200);
      body = checkResetPasswordTokenResponse.body as CheckResetPasswordTokenResponseDto;
      expect(typeof body).toBe('object');
      const { data: checkResetPasswordTokenResult } = body;
      expect(checkResetPasswordTokenResult.isValid).toBe(true);
      expect(checkResetPasswordTokenResult.userEmail).toBe(newUserDto.email);

      const newPassword = generateRandomPassword();
      const resetPasswordDto = {
        userId: newUserDto.id,
        token,
        password: newPassword,
      } satisfies ResetPasswordDto;
      const resetPasswordResponse = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(resetPasswordResponse.statusCode).toBe(200);
      body = resetPasswordResponse.body as ResetPasswordResponseDto;
      expect(typeof body).toBe('object');
      const { data: resetPasswordResult, message: resetPasswordMessage } = body;
      expect(resetPasswordMessage).toBe(events.users.userPasswordChanged);
      expect(resetPasswordResult.isPasswordSet).toBe(true);

      const loginResponse = await request(app.getServer())
        .post(authRoute.loginPath)
        .send({ email: newUserDto.email, password: newPassword } satisfies LoginDto);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = loginResponse.body.data as TranslatableHttpException;
      expect(typeof data).toBe('object');
      const { message: loginMessage }: { message: string } = data;
      expect(loginMessage).toBe(errorKeys.login.User_Is_Locked_Out);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLockedOut,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserPasswordChanged,
              testEventHandlers.lockedUserTriesToLogIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });

      expect(testEventHandlers.onUserLoggedIn).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS);
      expect(testEventHandlers.onUserPasswordChanged).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.lockedUserTriesToLogIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);

      expect(testEventHandlers.onUserPasswordChanged).toHaveBeenCalledWith(
        new UserPasswordChangedEvent({
          id: newUserDto.id,
          email: newUserDto.email,
          phone: newUserDto.phone,
        } satisfies IUserDto),
      );
      expect(testEventHandlers.lockedUserTriesToLogIn).toHaveBeenCalledWith(
        new LockedUserTriesToLogInEvent({
          id: newUserDto.id,
          email: newUserDto.email,
          phone: newUserDto.phone,
        } satisfies IUserDto),
      );
    });
  });

  describe('when reset password data are invalid', () => {
    it('when user id is invalid', async () => {
      const user = generateValidUser();
      const resetPasswordDto = {
        userId: 'invalid uuid',
        token: 'valid token',
        password: user.password,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.users.Invalid_User_Id).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user id is empty', async () => {
      const user = generateValidUser();
      const resetPasswordDto = {
        userId: '',
        token: 'valid token',
        password: user.password,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.users.Invalid_User_Id).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user id is null', async () => {
      const user = generateValidUser();
      const resetPasswordDto = {
        userId: null,
        token: 'valid token',
        password: user.password,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.users.Invalid_User_Id).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user id is undefined', async () => {
      const user = generateValidUser();
      const resetPasswordDto = {
        userId: undefined,
        token: 'valid token',
        password: user.password,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.users.Invalid_User_Id).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user not exists', async () => {
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

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      const resetPasswordDto = {
        userId: newUserDto.id,
        token: 'valid token',
        password: generateRandomPassword(),
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.users.Invalid_User_Id).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('when password is invalid', async () => {
      const resetPasswordDto = {
        userId: Guid.EMPTY,
        token: 'valid token',
        password: 'invalid password',
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.users.Invalid_Password).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when password is empty', async () => {
      const resetPasswordDto = {
        userId: Guid.EMPTY,
        token: 'valid token',
        password: '',
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.users.Invalid_Password).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when password is null', async () => {
      const resetPasswordDto = {
        userId: Guid.EMPTY,
        token: 'valid token',
        password: null,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.users.Invalid_Password).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when password is undefined', async () => {
      const resetPasswordDto = {
        userId: Guid.EMPTY,
        token: 'valid token',
        password: undefined,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.users.Invalid_Password).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when token is empty', async () => {
      const user = generateValidUser();
      const resetPasswordDto = {
        userId: Guid.EMPTY,
        token: '',
        password: user.password,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.login.Invalid_Reset_Password_Token).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when token is null', async () => {
      const user = generateValidUser();
      const resetPasswordDto = {
        userId: Guid.EMPTY,
        token: null,
        password: user.password,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.login.Invalid_Reset_Password_Token).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when token is undefined', async () => {
      const user = generateValidUser();
      const resetPasswordDto = {
        userId: Guid.EMPTY,
        token: undefined,
        password: user.password,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.login.Invalid_Reset_Password_Token).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when token is invalid', async () => {
      const { uuid, password } = getAdminLoginData();
      const resetPasswordDto = {
        userId: uuid,
        token: 'invalid token',
        password,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.login.Invalid_Reset_Password_Token).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when token is valid but userId is from different user', async () => {
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      let url = '';
      const mockSendEmailResetPassword = jest
        .fn()
        .mockImplementation(async (user: { firstName: string; lastName: string; email: string }, link: string) => {
          url = link;
          return await originalSendEmailResetPassword(user, link);
        });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPassword').mockImplementation(mockSendEmailResetPassword);

      const requestResetPasswordResponse = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: newUserDto.email } satisfies UserTryingToLogInDto);
      expect(requestResetPasswordResponse.statusCode).toBe(200);
      const body: RequestResetPasswordResponseDto = requestResetPasswordResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(7);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const { uuid, password } = getAdminLoginData();
      const resetPasswordDto = {
        userId: uuid,
        token,
        password,
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.login.Invalid_Reset_Password_Token).length).toBe(0);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('when token expired', async () => {
      const user = generateValidUser();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      let url = '';
      const mockSendEmailResetPassword = jest
        .fn()
        .mockImplementation(async (user: { firstName: string; lastName: string; email: string }, link: string) => {
          url = link;
          return await originalSendEmailResetPassword(user, link);
        });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPassword').mockImplementation(mockSendEmailResetPassword);

      const requestResetPasswordResponse = await request(app.getServer())
        .post(authRoute.requestResetPasswordPath)
        .send({ email: newUserDto.email } satisfies UserTryingToLogInDto);
      expect(requestResetPasswordResponse.statusCode).toBe(200);
      let body: RequestResetPasswordResponseDto | CheckResetPasswordTokenResponseDto =
        requestResetPasswordResponse.body as RequestResetPasswordResponseDto;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(7);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const expirationPeriod: number = ms(RESET_PASSWORD_TOKEN_EXPIRE_IN!);
      const expirationDate = new Date(Utils.getDateTimeNow().getTime() + expirationPeriod + 1);
      const getDateTimeNow = jest.spyOn(Utils, 'getDateTimeNow').mockImplementation(() => expirationDate);

      const checkResetPasswordTokenResponse = await request(app.getServer())
        .post(authRoute.checkResetPasswordTokenPath + '/' + newUserDto.id + '/' + token)
        .send();
      expect(checkResetPasswordTokenResponse.statusCode).toBe(200);
      body = checkResetPasswordTokenResponse.body as CheckResetPasswordTokenResponseDto;
      expect(typeof body).toBe('object');
      const { data: checkResetPasswordTokenResult } = body;
      expect(checkResetPasswordTokenResult.isValid).toBe(false);
      expect(checkResetPasswordTokenResult).toEqual({ isValid: false });

      const resetPasswordDto = {
        userId: newUserDto.id,
        token,
        password: generateRandomPassword(),
      } satisfies ResetPasswordDto;
      const response = await request(app.getServer()).post(authRoute.resetPasswordPath).send(resetPasswordDto);
      expect(response.statusCode).toBe(400);
      const errors = (response.body.data.message as string)?.split(',');
      expect(errors.filter(x => x !== errorKeys.login.Invalid_Reset_Password_Token).length).toBe(0);

      getDateTimeNow.mockRestore();

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
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
