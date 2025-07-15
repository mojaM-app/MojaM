import { VALIDATOR_SETTINGS } from '@config';
import { AuthenticationTypes, ILoginModel } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, GetUserResponseDto, userTestHelpers } from '@modules/users';
import {
  generateRandomDate,
  generateRandomNumber,
  generateRandomPassword,
  generateRandomString,
  getAdminLoginData,
} from '@utils';
import { Guid } from 'guid-typescript';
import request from 'supertest';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import {
  ActivateAccountDto,
  ActivateAccountResponseDto,
  IActivateAccountResultDto,
} from '../dtos/activate-account.dto';
import {
  AccountTryingToLogInDto,
  GetAccountBeforeLogInResponseDto,
  IGetAccountBeforeLogInResultDto,
} from '../dtos/get-account-before-log-in.dto';
import { AuthRoute } from '../routes/auth.routes';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('POST /auth/activate-account/', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await app.auth.loginAs({ email, passcode } satisfies ILoginModel))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('request should end with status code of 200', () => {
    it('when user with given id not exist', async () => {
      const model = {
        firstName: 'John',
        lastName: 'Smith',
        passcode: generateRandomPassword(),
        joiningDate: generateRandomDate(),
      } satisfies ActivateAccountDto;
      const response = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + Guid.EMPTY)
        .send(model);
      expect(response.statusCode).toBe(200);
      const body = response.body as ActivateAccountResponseDto;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult } = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);
      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when user with given id is active', async () => {
      const { uuid, email } = getAdminLoginData();
      let response = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + uuid)
        .send({} satisfies ActivateAccountDto);
      expect(response.statusCode).toBe(200);
      let body = response.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult } = body as ActivateAccountResponseDto;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);

      response = await app!.auth.getAccountBeforeLogIn({
        email,
      } satisfies AccountTryingToLogInDto);
      expect(response.statusCode).toBe(200);
      body = response.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserActivated].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
    });

    it('while activating when passcode is NULL, passcode should not be changed', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateResponse = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + user.id)
        .send({
          passcode: null as any,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;
      expect(newUserAccessToken).toBeDefined();

      const getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('while activating when passcode is UNDEFINED, passcode should not be changed', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateResponse = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + user.id)
        .send({
          passcode: undefined as any,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;
      expect(newUserAccessToken).toBeDefined();

      const getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('while activating when passcode is empty, passcode should not be changed', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateResponse = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + user.id)
        .send({
          passcode: '',
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;
      expect(newUserAccessToken).toBeDefined();

      const getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('while activating when password is set, password should be changed', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const password = generateRandomPassword();
      const activateResponse = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + user.id)
        .send({
          passcode: password,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);

      const loginData: ILoginModel = { email: requestData.email, passcode: requestData.passcode };
      let loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);

      loginData.passcode = password;
      loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(200);

      const getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('while activating when pin is set, pin should be changed', async () => {
      const requestData = userTestHelpers.generateValidUserWithPin();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const pin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH);
      const activateResponse = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + user.id)
        .send({
          passcode: pin,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);

      const loginData: ILoginModel = { email: requestData.email, passcode: requestData.passcode };
      let loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(400);

      loginData.passcode = pin;
      loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(200);

      const getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Pin,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: true,
        authType: AuthenticationTypes.Pin,
      } satisfies IGetAccountBeforeLogInResultDto);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onFailedLoginAttempt,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onFailedLoginAttempt).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('while activating when first and last name are set, first and last name should be set', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const firstName = generateRandomString();
      const lastName = generateRandomString();
      const activateResponse = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + user.id)
        .send({
          firstName,
          lastName,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);

      const getUserResponse = await app!.user.get(user.id, adminAccessToken);
      expect(getUserResponse.statusCode).toBe(200);
      body = getUserResponse.body;
      const { data: newUser }: GetUserResponseDto = body;
      expect(newUser).toBeDefined();
      expect(newUser!.firstName).toBe(firstName);
      expect(newUser!.lastName).toBe(lastName);

      const getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('while activating user without password, when password is set, password should be set', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      delete requestData.passcode;
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      let getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

      const password = generateRandomPassword();
      const activateResponse = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + user.id)
        .send({
          passcode: password,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);

      const loginData: ILoginModel = { email: requestData.email, passcode: password };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(200);

      getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: true,
        authType: AuthenticationTypes.Password,
      } satisfies IGetAccountBeforeLogInResultDto);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    it('while activating user without pin, when pin is set, pin should be set', async () => {
      const requestData = userTestHelpers.generateValidUserWithPin();
      delete requestData.passcode;
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      let getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

      const pin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH);
      const activateResponse = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + user.id)
        .send({
          passcode: pin,
        } satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(200);
      body = activateResponse.body;
      expect(typeof body).toBe('object');
      const { data: userToActivateResult }: ActivateAccountResponseDto = body;
      expect(userToActivateResult).toStrictEqual({
        isActive: true,
      } satisfies IActivateAccountResultDto);

      const loginData: ILoginModel = { email: requestData.email, passcode: pin };
      const loginResponse = await request(app!.getServer()).post(AuthRoute.loginPath).send(loginData);
      expect(loginResponse.statusCode).toBe(200);

      getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({
        isActive: true,
        authType: AuthenticationTypes.Pin,
      } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({
        isActive: true,
        authType: AuthenticationTypes.Pin,
      } satisfies IGetAccountBeforeLogInResultDto);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('request should end with status code of 400', () => {
    it('when passcode is invalid', async () => {
      const model = {
        firstName: 'John',
        lastName: 'Smith',
        joiningDate: generateRandomDate(),
      } satisfies ActivateAccountDto;
      const bodyData = [
        { ...model, passcode: 'invalid password' } satisfies ActivateAccountDto,
        { ...model, passcode: 123 as any } satisfies ActivateAccountDto,
        { ...model, passcode: true as any } satisfies ActivateAccountDto,
        { ...model, passcode: [] as any } satisfies ActivateAccountDto,
        { ...model, passcode: {} as any } satisfies ActivateAccountDto,
        { ...model, passcode: 'invalid pin' } satisfies ActivateAccountDto,
        { ...model, passcode: 1234 as any } satisfies ActivateAccountDto,
        { ...model, passcode: generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH - 1) } satisfies ActivateAccountDto,
        { ...model, passcode: generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH + 1) } satisfies ActivateAccountDto,
      ];

      for (const body of bodyData) {
        const response = await request(app!.getServer())
          .post(AuthRoute.activateAccountPath + '/' + Guid.EMPTY)
          .send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => x !== errorKeys.users.Invalid_Passcode).length).toBe(0);

        // checking events running via eventDispatcher
        Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      }
    });

    it('when firstName is invalid', async () => {
      const model = {
        lastName: 'Smith',
        joiningDate: generateRandomDate(),
        passcode: generateRandomPassword(),
      } satisfies ActivateAccountDto;
      const bodyData = [
        { ...model, firstName: 123 as any } satisfies ActivateAccountDto,
        { ...model, firstName: true as any } satisfies ActivateAccountDto,
        { ...model, firstName: [] as any } satisfies ActivateAccountDto,
        { ...model, firstName: {} as any } satisfies ActivateAccountDto,
      ];

      for (const body of bodyData) {
        const response = await request(app!.getServer())
          .post(AuthRoute.activateAccountPath + '/' + Guid.EMPTY)
          .send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => !x.includes('Name')).length).toBe(0);

        // checking events running via eventDispatcher
        Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      }
    });

    it('when lastName is invalid', async () => {
      const model = {
        firstName: 'John',
        joiningDate: generateRandomDate(),
        passcode: generateRandomPassword(),
      } satisfies ActivateAccountDto;
      const bodyData = [
        { ...model, lastName: 123 as any } satisfies ActivateAccountDto,
        { ...model, lastName: true as any } satisfies ActivateAccountDto,
        { ...model, lastName: [] as any } satisfies ActivateAccountDto,
        { ...model, lastName: {} as any } satisfies ActivateAccountDto,
      ];

      for (const body of bodyData) {
        const response = await request(app!.getServer())
          .post(AuthRoute.activateAccountPath + '/' + Guid.EMPTY)
          .send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => !x.includes('Name')).length).toBe(0);

        // checking events running via eventDispatcher
        Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      }
    });

    it('when joiningDate is invalid', async () => {
      const model = {
        firstName: 'John',
        lastName: 'Smith',
        passcode: generateRandomPassword(),
      } satisfies ActivateAccountDto;
      const bodyData = [
        { ...model, joiningDate: 'some text' as any } satisfies ActivateAccountDto,
        { ...model, joiningDate: [] as any } satisfies ActivateAccountDto,
        { ...model, joiningDate: {} as any } satisfies ActivateAccountDto,
      ];

      for (const body of bodyData) {
        const response = await request(app!.getServer())
          .post(AuthRoute.activateAccountPath + '/' + Guid.EMPTY)
          .send(body);
        expect(response.statusCode).toBe(400);
        const data = response.body.data as BadRequestException;
        const errors = data.message.split(',');
        expect(errors.filter(x => !x.includes('JoiningDate')).length).toBe(0);

        // checking events running via eventDispatcher
        Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      }
    });

    it('while activating user without pin, when pin is NOT set', async () => {
      const requestData = userTestHelpers.generateValidUserWithPin();
      delete requestData.passcode;
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const getAccountBeforeLogInResponse = await app!.auth.getAccountBeforeLogIn({
        email: requestData.email,
      } satisfies AccountTryingToLogInDto);
      expect(getAccountBeforeLogInResponse.statusCode).toBe(200);
      body = getAccountBeforeLogInResponse.body as GetAccountBeforeLogInResponseDto;
      expect(body.data).toStrictEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);
      expect(body.data).toEqual({ isActive: false } satisfies IGetAccountBeforeLogInResultDto);

      const activateResponse = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/' + user.id)
        .send({} satisfies ActivateAccountDto);
      expect(activateResponse.statusCode).toBe(400);
      const data = activateResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => !x.includes(errorKeys.users.Activation_Failed_Passcode_Is_Not_Set)).length).toBe(0);

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

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

  describe('request should end with status code of 404', () => {
    it('when user id is invalid', async () => {
      const response = await request(app!.getServer())
        .post(AuthRoute.activateAccountPath + '/invalidUserId')
        .send();
      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as BadRequestException;
      expect(typeof body).toBe('object');
      const { message: activateMessage }: { message: string } = body;
      expect(activateMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
