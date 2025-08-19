import { events, ILoginModel } from '@core';
import { errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { userTestHelpers } from '@modules/users';
import { generateRandomDate, getAdminLoginData } from '@utils';
import request from 'supertest';
import Container from 'typedi';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateUserResponseDto } from '../dtos/create-user.dto';
import { GetUserProfileResponseDto, IGetUserProfileDto } from '../dtos/get-user-profile.dto';
import { UserProfileRoute } from '../routes/user-profile.routes';
import { UserProfileService } from '../services/user-profile.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('GET/user-profile', () => {
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

  describe('GET should respond with a status code of 200', () => {
    test('when data are valid', async () => {
      const newUser = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode } satisfies ILoginModel)
      )?.accessToken;

      const getUserProfileResponse = await app!.userProfile.get(newUserAccessToken);
      expect(getUserProfileResponse.statusCode).toBe(200);
      expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserProfileResponse.body;
      expect(typeof body).toBe('object');
      const { data: userProfile, message: getMessage }: GetUserProfileResponseDto = body;
      expect(getMessage).toBe(events.users.userProfileRetrieved);
      expect(userProfile).toBeDefined();
      expect(userProfile!.hasOwnProperty('uuid')).toBe(false);
      expect(userProfile!.hasOwnProperty('id')).toBe(false);
      expect(userProfile!.email).toBeDefined();
      expect(userProfile!.email).toBe(newUserDto.email);
      expect(userProfile!.phone).toBeDefined();
      expect(userProfile!.phone).toBe(newUserDto.phone);
      userProfile!.joiningDate = new Date(userProfile!.joiningDate!);
      expect(userProfile!.joiningDate.toDateString()).toEqual(newUser.joiningDate.toDateString());
      expect(userProfile!.firstName).toBeDefined();
      expect(userProfile!.firstName).toBe(newUser.firstName);
      expect(userProfile!.lastName).toBeDefined();
      expect(userProfile!.lastName).toBe(newUser.lastName);

      expect(userProfile).toStrictEqual({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        joiningDate: newUser.joiningDate,
        email: newUserDto.email,
        phone: newUserDto.phone,
      } satisfies IGetUserProfileDto);

      expect(userProfile).toEqual({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        joiningDate: newUser.joiningDate,
        email: newUserDto.email,
        phone: newUserDto.phone,
      } satisfies IGetUserProfileDto);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserProfileRetrieved,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserActivated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserProfileRetrieved).toHaveBeenCalledTimes(1);
    });

    test('when user has no permissions (permissions are not needed)', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getUserProfileResponse = await app!.userProfile.get(newUserAccessToken);
      expect(getUserProfileResponse.statusCode).toBe(200);

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
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
              testEventHandlers.onUserProfileRetrieved,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserProfileRetrieved).toHaveBeenCalled();
    });
  });

  describe('GET should respond with a status code of 401', () => {
    test('when try to get profile that not exist', async () => {
      const newUser = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode } satisfies ILoginModel)
      )?.accessToken;

      const deleteUserResponse = await app!.user.delete(newUserDto.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      const getUserProfileResponse = await app!.userProfile.get(newUserAccessToken);
      expect(getUserProfileResponse.statusCode).toBe(401);
      const body = getUserProfileResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as UnauthorizedException;
      const { message: getProfileMessage, args: getProfileArgs } = data;
      expect(getProfileMessage).toBe(errorKeys.login.Wrong_Authentication_Token);
      expect(getProfileArgs).toBeUndefined();

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserProfileRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when token is invalid', async () => {
      const getUserProfileResponse = await app!.userProfile.get(`Bearer invalid_token_${adminAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(401);
      const body = getUserProfileResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when token is not set', async () => {
      const getUserProfileResponse = await app!.userProfile.get();
      expect(getUserProfileResponse.statusCode).toBe(401);
      const body = getUserProfileResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  //describe('GET should respond with a status code of 403', () => {});

  describe('GET should respond with a status code of 404', () => {
    test('GET should respond with a status code of 404 when path is invalid', async () => {
      const getUserProfileResponse = await request(app!.getServer())
        .get(UserProfileRoute.path + '/invalid-path')
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(404);
      expect(getUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserProfileResponse.body;
      expect(typeof body).toBe('object');
      const { message: deleteMessage }: { message: string } = body;
      expect(deleteMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should respond with a status code of 500', () => {
    it('when service throws an error', async () => {
      const userProfileService = Container.get(UserProfileService);
      const mockGet = jest.spyOn(userProfileService, 'get').mockRejectedValue(new Error('Service error'));
      const getUserProfileResponse = await app!.userProfile.get(adminAccessToken);
      expect(getUserProfileResponse.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
