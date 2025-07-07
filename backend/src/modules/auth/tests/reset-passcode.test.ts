import { RESET_PASSWORD_TOKEN_EXPIRE_IN, USER_ACCOUNT_LOCKOUT_SETTINGS, VALIDATOR_SETTINGS } from '@config';
import { AuthenticationTypes, events, ILoginModel, IResetPasscodeEmailSettings, RouteConstants } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { EmailService } from '@modules/notifications/services/email.service';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import * as Utils from '@utils';
import { generateRandomNumber, generateRandomPassword, getAdminLoginData } from '@utils';
import { Guid } from 'guid-typescript';
import ms from 'ms';
import request from 'supertest';
import Container from 'typedi';
import {
  CheckResetPasscodeTokenResponseDto,
  ICheckResetPasscodeTokenResultDto,
} from '../dtos/check-reset-passcode-token.dto';
import { AccountTryingToLogInDto } from '../dtos/get-account-before-log-in.dto';
import { LoginResponseDto } from '../dtos/login.dto';
import { RequestResetPasscodeResponseDto } from '../dtos/request-reset-passcode.dto';
import { ResetPasscodeDto, ResetPasscodeResponseDto } from '../dtos/reset-passcode.dto';
import { AuthRoute } from '../routes/auth.routes';
import { ResetPasscodeService } from '../services/reset-passcode.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { TestApp } from './../../../helpers/tests.utils';

describe('POST /auth/reset-passcode', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;
  let originalSendEmailResetPasscode: (settings: IResetPasscodeEmailSettings) => Promise<boolean>;

  beforeAll(async () => {
    const emailService = new EmailService();
    originalSendEmailResetPasscode = emailService.sendEmailResetPasscode.bind(emailService);

    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();

    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await testHelpers.loginAs(app, { email, passcode } satisfies ILoginModel))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('when reset password data are valid', () => {
    it('when user is inactive, after reset password user should be active and should be able to log in', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      let url = '';
      const mockSendEmailResetPasscode = jest.fn().mockImplementation(async (settings: IResetPasscodeEmailSettings) => {
        url = settings.link;
        return await originalSendEmailResetPasscode(settings);
      });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPasscode').mockImplementation(mockSendEmailResetPasscode);

      const requestResetPasscodeResponse = await request(app!.getServer())
        .post(AuthRoute.requestResetPasscodePath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(requestResetPasscodeResponse.statusCode).toBe(200);
      let body: RequestResetPasscodeResponseDto | ResetPasscodeResponseDto | CheckResetPasscodeTokenResponseDto =
        requestResetPasscodeResponse.body as RequestResetPasscodeResponseDto;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(8);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const checkResetPasscodeTokenResponse = await request(app!.getServer())
        .post(AuthRoute.checkResetPasscodeTokenPath + '/' + newUserDto.id + '/' + token)
        .send();
      expect(checkResetPasscodeTokenResponse.statusCode).toBe(200);
      body = checkResetPasscodeTokenResponse.body as CheckResetPasscodeTokenResponseDto;
      expect(typeof body).toBe('object');
      const { data: checkResetPasscodeTokenResult } = body;
      expect(checkResetPasscodeTokenResult).toStrictEqual({
        isValid: true,
        userEmail: newUserDto.email,
        authType: AuthenticationTypes.Password,
      } satisfies ICheckResetPasscodeTokenResultDto);
      expect(checkResetPasscodeTokenResult).toEqual({
        isValid: true,
        userEmail: newUserDto.email,
        authType: AuthenticationTypes.Password,
      } satisfies ICheckResetPasscodeTokenResultDto);

      const newPassword = generateRandomPassword();
      const resetPasscodeDto = {
        token,
        passcode: newPassword,
      } satisfies ResetPasscodeDto;
      const resetPasscodeResponse = await request(app!.getServer())
        .post(AuthRoute.resetPasscodePath + '/' + newUserDto.id)
        .send(resetPasscodeDto);
      expect(resetPasscodeResponse.statusCode).toBe(200);
      body = resetPasscodeResponse.body as ResetPasscodeResponseDto;
      expect(typeof body).toBe('object');
      const { data: resetPasscodeResult, message: resetPasscodeMessage } = body;
      expect(resetPasscodeMessage).toBe(events.users.userPasscodeChanged);
      expect(resetPasscodeResult.isPasscodeSet).toBe(true);

      const newUserAccessToken = (
        await testHelpers.loginAs(app!, { email: newUserDto.email, passcode: newPassword } satisfies ILoginModel)
      )?.accessToken;
      expect(newUserAccessToken).toBeDefined();
      expect(newUserAccessToken!.length).toBeGreaterThan(1);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserPasscodeChanged,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });

      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserPasscodeChanged).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('when user is active, after reset password user should be active and should be able to log in', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      const activateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      let url = '';
      const mockSendEmailResetPasscode = jest.fn().mockImplementation(async (settings: IResetPasscodeEmailSettings) => {
        url = settings.link;
        return await originalSendEmailResetPasscode(settings);
      });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPasscode').mockImplementation(mockSendEmailResetPasscode);

      const requestResetPasscodeResponse = await request(app!.getServer())
        .post(AuthRoute.requestResetPasscodePath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(requestResetPasscodeResponse.statusCode).toBe(200);
      let body: RequestResetPasscodeResponseDto | ResetPasscodeResponseDto | CheckResetPasscodeTokenResponseDto =
        requestResetPasscodeResponse.body as RequestResetPasscodeResponseDto;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(8);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const checkResetPasscodeTokenResponse = await request(app!.getServer())
        .post(AuthRoute.checkResetPasscodeTokenPath + '/' + newUserDto.id + '/' + token)
        .send();
      expect(checkResetPasscodeTokenResponse.statusCode).toBe(200);
      body = checkResetPasscodeTokenResponse.body as CheckResetPasscodeTokenResponseDto;
      expect(typeof body).toBe('object');
      const { data: checkResetPasscodeTokenResult } = body;
      expect(checkResetPasscodeTokenResult).toStrictEqual({
        isValid: true,
        userEmail: newUserDto.email,
        authType: AuthenticationTypes.Password,
      } satisfies ICheckResetPasscodeTokenResultDto);
      expect(checkResetPasscodeTokenResult).toEqual({
        isValid: true,
        userEmail: newUserDto.email,
        authType: AuthenticationTypes.Password,
      } satisfies ICheckResetPasscodeTokenResultDto);

      const newPassword = generateRandomPassword();
      const resetPasscodeDto = {
        token,
        passcode: newPassword,
      } satisfies ResetPasscodeDto;
      const resetPasscodeResponse = await request(app!.getServer())
        .post(AuthRoute.resetPasscodePath + '/' + newUserDto.id)
        .send(resetPasscodeDto);
      expect(resetPasscodeResponse.statusCode).toBe(200);
      body = resetPasscodeResponse.body as ResetPasscodeResponseDto;
      expect(typeof body).toBe('object');
      const { data: resetPasscodeResult, message: resetPasscodeMessage } = body;
      expect(resetPasscodeMessage).toBe(events.users.userPasscodeChanged);
      expect(resetPasscodeResult.isPasscodeSet).toBe(true);

      const newUserAccessToken = (
        await testHelpers.loginAs(app!, { email: newUserDto.email, passcode: newPassword } satisfies ILoginModel)
      )?.accessToken;
      expect(newUserAccessToken).toBeDefined();
      expect(newUserAccessToken!.length).toBeGreaterThan(1);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
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
              testEventHandlers.onUserPasscodeChanged,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });

      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserPasscodeChanged).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('when user is lockedOut, after reset password user should be active and should be unlocked (should be able to log in)', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      const activateUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH + '/' + newUserDto.id + '/' + RouteConstants.USER_ACTIVATE_PATH)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const loginData: ILoginModel = {
        email: newUserDto.email,
        phone: newUserDto.phone,
        passcode: user.passcode + 'invalid_password',
      };
      for (let index = 1; index < USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS; index++) {
        const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
        expect(loginResponse.statusCode).toBe(400);
        expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        expect(typeof loginResponse.body).toBe('object');
        const data = loginResponse.body.data as BadRequestException;
        const { message: loginMessage, args: loginArgs } = data;
        expect(loginMessage).toBe(errorKeys.login.Invalid_Login_Or_Passcode);
        expect(loginArgs).toBeUndefined();
      }

      let loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);
      expect(loginResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      expect(typeof loginResponse.body).toBe('object');
      const data = loginResponse.body.data as BadRequestException;
      const { message: loginMessage1, args: loginArgs } = data;
      expect(loginMessage1).toBe(errorKeys.login.Account_Is_Locked_Out);
      expect(loginArgs).toBeUndefined();

      let url = '';
      const mockSendEmailResetPasscode = jest.fn().mockImplementation(async (settings: IResetPasscodeEmailSettings) => {
        url = settings.link;
        return await originalSendEmailResetPasscode(settings);
      });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPasscode').mockImplementation(mockSendEmailResetPasscode);

      const requestResetPasscodeResponse = await request(app!.getServer())
        .post(AuthRoute.requestResetPasscodePath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(requestResetPasscodeResponse.statusCode).toBe(200);
      let body: any = requestResetPasscodeResponse.body as RequestResetPasscodeResponseDto;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(8);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const checkResetPasscodeTokenResponse = await request(app!.getServer())
        .post(AuthRoute.checkResetPasscodeTokenPath + '/' + newUserDto.id + '/' + token)
        .send();
      expect(checkResetPasscodeTokenResponse.statusCode).toBe(200);
      body = checkResetPasscodeTokenResponse.body as CheckResetPasscodeTokenResponseDto;
      expect(typeof body).toBe('object');
      const { data: checkResetPasscodeTokenResult } = body;
      expect(checkResetPasscodeTokenResult).toStrictEqual({
        isValid: true,
        userEmail: newUserDto.email,
        authType: AuthenticationTypes.Password,
      } satisfies ICheckResetPasscodeTokenResultDto);
      expect(checkResetPasscodeTokenResult).toEqual({
        isValid: true,
        userEmail: newUserDto.email,
        authType: AuthenticationTypes.Password,
      } satisfies ICheckResetPasscodeTokenResultDto);

      const newPassword = generateRandomPassword();
      const resetPasscodeDto = {
        token,
        passcode: newPassword,
      } satisfies ResetPasscodeDto;
      const resetPasscodeResponse = await request(app!.getServer())
        .post(AuthRoute.resetPasscodePath + '/' + newUserDto.id)
        .send(resetPasscodeDto);
      expect(resetPasscodeResponse.statusCode).toBe(200);
      body = resetPasscodeResponse.body as ResetPasscodeResponseDto;
      expect(typeof body).toBe('object');
      const { data: resetPasscodeResult, message: resetPasscodeMessage } = body;
      expect(resetPasscodeMessage).toBe(events.users.userPasscodeChanged);
      expect(resetPasscodeResult.isPasscodeSet).toBe(true);

      loginResponse = await request(app!.getServer())
        .post(AuthRoute.loginPath)
        .send({ email: newUserDto.email, passcode: newPassword } satisfies ILoginModel);
      expect(loginResponse.statusCode).toBe(200);
      body = loginResponse.body as LoginResponseDto;
      const { data: userLoggedIn, message: loginMessage } = body;
      expect(loginMessage).toBe(events.users.userLoggedIn);
      expect(userLoggedIn.email).toBe(newUserDto.email);
      expect(userLoggedIn.phone).toBe(newUserDto.phone);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
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
              testEventHandlers.onUserPasscodeChanged,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });

      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLockedOut).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(
        USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS,
      );
      expect(testEventHandlers.onUserPasscodeChanged).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('when reset password data are invalid', () => {
    it('when user id is not set', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const invalidUserIds = ['invalid uuid', '', null, undefined];

      for (const invalidUserId of invalidUserIds) {
        const resetPasscodeDto = {
          token: 'valid token',
          passcode: user.passcode!,
        } satisfies ResetPasscodeDto;
        const response = await request(app!.getServer())
          .post(AuthRoute.resetPasscodePath + '/' + invalidUserId)
          .send(resetPasscodeDto);
        expect(response.statusCode).toBe(404);
      }

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user id invalid', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();

      const invalidUserIds = [Guid.EMPTY];

      for (const invalidUserId of invalidUserIds) {
        const resetPasscodeDto = {
          token: 'valid token',
          passcode: user.passcode!,
        } satisfies ResetPasscodeDto;
        const response = await request(app!.getServer())
          .post(AuthRoute.resetPasscodePath + '/' + invalidUserId)
          .send(resetPasscodeDto);
        expect(response.statusCode).toBe(400);
      }

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user not exists', async () => {
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

      const deleteUserResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      const resetPasscodeModels = [
        {
          token: 'valid token',
          passcode: generateRandomPassword(),
        } satisfies ResetPasscodeDto,
        {
          token: 'valid token',
          passcode: generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH),
        } satisfies ResetPasscodeDto,
      ];

      for (const resetPasscodeModel of resetPasscodeModels) {
        const response = await request(app!.getServer())
          .post(AuthRoute.resetPasscodePath + '/' + newUserDto.id)
          .send(resetPasscodeModel);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => x !== errorKeys.users.Invalid_User_Id).length).toBe(0);
      }

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('when password/pin is invalid', async () => {
      const resetPasscodeModels = [
        {
          token: 'valid token',
          passcode: 'invalid password and token',
        } satisfies ResetPasscodeDto,
        {
          token: 'valid token',
          passcode: '',
        } satisfies ResetPasscodeDto,
        {
          token: 'valid token',
          passcode: null as any,
        } satisfies ResetPasscodeDto,
        {
          token: 'valid token',
          passcode: undefined as any,
        } satisfies ResetPasscodeDto,
      ];
      for (const resetPasscodeModel of resetPasscodeModels) {
        const response = await request(app!.getServer())
          .post(AuthRoute.resetPasscodePath + '/' + Guid.EMPTY)
          .send(resetPasscodeModel);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => x !== errorKeys.users.Invalid_Passcode).length).toBe(0);
      }

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when token is invalid', async () => {
      const password = generateRandomPassword();
      const pin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH);

      const resetPasscodeModels = [
        {
          token: '',
          passcode: password,
        } satisfies ResetPasscodeDto,
        {
          token: null as any,
          passcode: password,
        } satisfies ResetPasscodeDto,
        {
          token: undefined as any,
          passcode: password,
        } satisfies ResetPasscodeDto,
        {
          token: 'invalid token',
          passcode: password,
        } satisfies ResetPasscodeDto,
        {
          token: '',
          passcode: pin,
        } satisfies ResetPasscodeDto,
        {
          token: null as any,
          passcode: pin,
        } satisfies ResetPasscodeDto,
        {
          token: undefined as any,
          passcode: pin,
        } satisfies ResetPasscodeDto,
        {
          token: 'invalid token',
          passcode: pin,
        } satisfies ResetPasscodeDto,
      ];

      for (const resetPasscodeModel of resetPasscodeModels) {
        const response = await request(app!.getServer())
          .post(AuthRoute.resetPasscodePath + '/' + getAdminLoginData().uuid)
          .send(resetPasscodeModel);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => x !== errorKeys.login.Invalid_Reset_Passcode_Token).length).toBe(0);
      }

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when token is valid but userId is from different user', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      let url = '';
      const mockSendEmailResetPasscode = jest.fn().mockImplementation(async (settings: IResetPasscodeEmailSettings) => {
        url = settings.link;
        return await originalSendEmailResetPasscode(settings);
      });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPasscode').mockImplementation(mockSendEmailResetPasscode);

      const requestResetPasscodeResponse = await request(app!.getServer())
        .post(AuthRoute.requestResetPasscodePath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(requestResetPasscodeResponse.statusCode).toBe(200);
      const body: RequestResetPasscodeResponseDto = requestResetPasscodeResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(8);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const { uuid: adminUuid } = getAdminLoginData();
      expect(newUserDto.id).not.toBe(adminUuid);
      const resetPasscodeDto = {
        token,
        passcode: generateRandomPassword(),
      } satisfies ResetPasscodeDto;
      const response = await request(app!.getServer())
        .post(AuthRoute.resetPasscodePath + '/' + adminUuid)
        .send(resetPasscodeDto);
      expect(response.statusCode).toBe(400);
      const data = response.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.login.Invalid_Reset_Passcode_Token).length).toBe(0);

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });

    it('when token expired', async () => {
      const user = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer())
        .post(RouteConstants.USER_PATH)
        .send(user)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto.email).toBe(user.email);

      let url = '';
      const mockSendEmailResetPasscode = jest.fn().mockImplementation(async (settings: IResetPasscodeEmailSettings) => {
        url = settings.link;
        return await originalSendEmailResetPasscode(settings);
      });
      jest.spyOn(EmailService.prototype, 'sendEmailResetPasscode').mockImplementation(mockSendEmailResetPasscode);

      const requestResetPasscodeResponse = await request(app!.getServer())
        .post(AuthRoute.requestResetPasscodePath)
        .send({ email: newUserDto.email } satisfies AccountTryingToLogInDto);
      expect(requestResetPasscodeResponse.statusCode).toBe(200);
      let body: RequestResetPasscodeResponseDto | CheckResetPasscodeTokenResponseDto =
        requestResetPasscodeResponse.body as RequestResetPasscodeResponseDto;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const splittedUrl = url?.split('/') ?? [];
      expect(splittedUrl.length).toBe(8);
      expect(splittedUrl[5]).toBe(newUserDto.id);
      const token = splittedUrl[splittedUrl.length - 1];
      expect(token?.length).toBe(64);

      const expirationPeriod: number = ms(RESET_PASSWORD_TOKEN_EXPIRE_IN!);
      const expirationDate = new Date(Utils.getDateTimeNow().getTime() + expirationPeriod + 1);
      const getDateTimeNow = jest.spyOn(Utils, 'getDateTimeNow').mockImplementation(() => expirationDate);

      const checkResetPasscodeTokenResponse = await request(app!.getServer())
        .post(AuthRoute.checkResetPasscodeTokenPath + '/' + newUserDto.id + '/' + token)
        .send();
      expect(checkResetPasscodeTokenResponse.statusCode).toBe(200);
      body = checkResetPasscodeTokenResponse.body as CheckResetPasscodeTokenResponseDto;
      expect(typeof body).toBe('object');
      const { data: checkResetPasscodeTokenResult } = body;
      expect(checkResetPasscodeTokenResult).toStrictEqual({
        isValid: false,
      } satisfies ICheckResetPasscodeTokenResultDto);
      expect(checkResetPasscodeTokenResult).toEqual({
        isValid: false,
      } satisfies ICheckResetPasscodeTokenResultDto);

      const resetPasscodeDto = {
        token,
        passcode: generateRandomPassword(),
      } satisfies ResetPasscodeDto;
      const response = await request(app!.getServer())
        .post(AuthRoute.resetPasscodePath + '/' + newUserDto.id)
        .send(resetPasscodeDto);
      expect(response.statusCode).toBe(400);
      const data = response.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.login.Invalid_Reset_Passcode_Token).length).toBe(0);

      getDateTimeNow.mockRestore();

      const deleteResponse = await request(app!.getServer())
        .delete(RouteConstants.USER_PATH + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
    });
  });

  describe('GET should handle errors', () => {
    it('when service throws an error', async () => {
      const resetPasscodeService = Container.get(ResetPasscodeService);
      const mockGet = jest.spyOn(resetPasscodeService, 'resetPasscode').mockRejectedValue(new Error('Service error'));
      const response = await request(app!.getServer())
        .post(AuthRoute.resetPasscodePath + '/' + Guid.EMPTY)
        .send({
          token: 'valid token',
          passcode: generateRandomPassword(),
        } satisfies ResetPasscodeDto);
      expect(response.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
