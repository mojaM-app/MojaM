import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { userTestHelpers } from '@modules/users';
import { generateRandomDate, getAdminLoginData, isGuid } from '@utils';
import { Guid } from 'guid-typescript';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateUserResponseDto } from '../dtos/create-user.dto';
import { GetUserResponseDto } from '../dtos/get-user.dto';
import { UserRetrievedEvent } from '../events/user-retrieved-event';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('GET/user/:id', () => {
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
    test('when data are valid and user has permission', async () => {
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

      const getUserResponse = await app!.user.get(newUserDto.id, adminAccessToken);
      expect(getUserResponse.statusCode).toBe(200);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: getMessage }: GetUserResponseDto = body;
      expect(getMessage).toBe(events.users.userRetrieved);
      expect(user).toBeDefined();
      expect(user!.id).toBeDefined();
      expect(isGuid(user!.id)).toBe(true);
      expect(user!.id).toBe(newUserDto.id);
      expect(user?.email).toBeDefined();
      expect(user!.email).toBe(newUserDto.email);
      expect(user?.phone).toBeDefined();
      expect(user!.phone).toBe(newUserDto.phone);
      expect(user!.hasOwnProperty('uuid')).toBe(false);
      user!.joiningDate = new Date(user!.joiningDate!);
      expect(user!.joiningDate.toDateString()).toEqual(newUser.joiningDate.toDateString());
      expect(user?.firstName).toBeDefined();
      expect(user!.firstName).toBe(newUser.firstName);
      expect(user?.lastName).toBeDefined();
      expect(user!.lastName).toBe(newUser.lastName);

      const deleteUserResponse = await app!.user.delete(user!.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserRetrieved).toHaveBeenCalledWith(new UserRetrievedEvent(user!, 1));
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should respond with a status code of 403', () => {
    test('when user has no permission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
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

      const getUserResponse = await app!.user.get(newUserDto.id, newUserAccessToken);
      expect(getUserResponse.statusCode).toBe(403);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when user have all permissions expect EditUser', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(newUserDto.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(newUserDto.id, adminAccessToken, [
        SystemPermissions.EditUser,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getUserResponse = await app!.user.get(newUserDto.id, newUserAccessToken);
      expect(getUserResponse.statusCode).toBe(403);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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
              testEventHandlers.onPermissionAdded,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('GET should respond with a status code of 400', () => {
    test('GET should respond with a status code of 400 when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const getUserResponse = await app!.user.get(userId, adminAccessToken);
      expect(getUserResponse.statusCode).toBe(400);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: getMessage, args: getArgs } = data;
      expect(getMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(getArgs).toEqual({ id: userId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should respond with a status code of 404', () => {
    test('GET should respond with a status code of 404 when user Id is not GUID', async () => {
      const getUserResponse = await app!.user.get('invalid-guid', adminAccessToken);
      expect(getUserResponse.statusCode).toBe(404);
      expect(getUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserResponse.body;
      expect(typeof body).toBe('object');
      const { message: deleteMessage }: { message: string } = body;
      expect(deleteMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should respond with a status code of 401', () => {
    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const getUserResponse = await app!.user.get(userId);
      expect(getUserResponse.statusCode).toBe(401);
      const body = getUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const getUserResponse = await app!.user.get(userId, `invalid_token_${adminAccessToken}`);
      expect(getUserResponse.statusCode).toBe(401);
      const body = getUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

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
