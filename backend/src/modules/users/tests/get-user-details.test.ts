import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { userTestHelpers } from '@modules/users';
import { generateRandomDate, getAdminLoginData, isGuid } from '@utils';
import { Guid } from 'guid-typescript';
import { testEventHandlers } from '../../../helpers/event-handler-tests.helper';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateUserResponseDto } from '../dtos/create-user.dto';
import { GetUserDetailsResponseDto, IUserDetailsDto } from '../dtos/get-user-details.dto';
import { UserDetailsRetrievedEvent } from '../events/user-details-retrieved-event';

describe('GET/user-details/:id', () => {
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

      const getUserDetailsResponse = await app!.userDetails.get(newUserDto.id, adminAccessToken);
      expect(getUserDetailsResponse.statusCode).toBe(200);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserDetailsResponse.body;
      expect(typeof body).toBe('object');
      const { data: userDetails, message: getMessage }: GetUserDetailsResponseDto = body;
      expect(getMessage).toBe(events.users.userDetailsRetrieved);
      expect(userDetails).toBeDefined();
      expect(userDetails!.id).toBeDefined();
      expect(isGuid(userDetails!.id)).toBe(true);
      expect(userDetails!.id).toBe(newUserDto.id);
      expect(userDetails!.hasOwnProperty('uuid')).toBe(false);
      expect(userDetails!.email).toBeDefined();
      expect(userDetails!.email).toBe(newUserDto.email);
      expect(userDetails!.phone).toBeDefined();
      expect(userDetails!.phone).toBe(newUserDto.phone);
      userDetails!.joiningDate = new Date(userDetails!.joiningDate!);
      expect(userDetails!.joiningDate.toDateString()).toEqual(newUser.joiningDate.toDateString());
      expect(userDetails!.isActive).toBe(false);
      expect(userDetails!.isLockedOut).toBe(false);
      expect(userDetails!.permissionCount).toBe(0);
      expect(userDetails!.firstName).toBeDefined();
      expect(userDetails!.firstName).toBe(newUser.firstName);
      expect(userDetails!.lastName).toBeDefined();
      expect(userDetails!.lastName).toBe(newUser.lastName);
      expect(userDetails!.lastLoginAt).toBeNull();

      expect(userDetails).toStrictEqual({
        id: newUserDto.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        joiningDate: newUser.joiningDate,
        email: newUserDto.email,
        phone: newUserDto.phone,
        lastLoginAt: null,
        isLockedOut: false,
        permissionCount: 0,
        isActive: false,
      } satisfies IUserDetailsDto);

      expect(userDetails).toEqual({
        id: newUserDto.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        joiningDate: newUser.joiningDate,
        email: newUserDto.email,
        phone: newUserDto.phone,
        lastLoginAt: null,
        isLockedOut: false,
        permissionCount: 0,
        isActive: false,
      } satisfies IUserDetailsDto);

      const deleteUserResponse = await app!.user.delete(userDetails!.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserDetailsRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDetailsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDetailsRetrieved).toHaveBeenCalledWith(
        new UserDetailsRetrievedEvent(userDetails!, 1),
      );
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

      const getUserDetailsResponse = await app!.userDetails.get(newUserDto.id, newUserAccessToken);
      expect(getUserDetailsResponse.statusCode).toBe(403);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserDetailsResponse.body;
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
      expect(testEventHandlers.onUserDetailsRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when user have all permissions expect PreviewUserDetails', async () => {
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
        SystemPermissions.PreviewUserDetails,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;

      const getUserDetailsResponse = await app!.userDetails.get(newUserDto.id, newUserAccessToken);
      expect(getUserDetailsResponse.statusCode).toBe(403);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getUserDetailsResponse.body;
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
      expect(testEventHandlers.onUserDetailsRetrieved).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('GET should respond with a status code of 400', () => {
    test('GET should respond with a status code of 400 when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const getUserDetailsResponse = await app!.userDetails.get(userId, adminAccessToken);
      expect(getUserDetailsResponse.statusCode).toBe(400);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserDetailsResponse.body;
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
      const getUserDetailsResponse = await app!.userDetails.get('invalid-guid', adminAccessToken);
      expect(getUserDetailsResponse.statusCode).toBe(404);
      expect(getUserDetailsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getUserDetailsResponse.body;
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
      const getUserDetailsResponse = await app!.userDetails.get(userId);
      expect(getUserDetailsResponse.statusCode).toBe(401);
      const body = getUserDetailsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const getUserDetailsResponse = await app!.userDetails.get(userId, `invalid_token_${adminAccessToken}`);
      expect(getUserDetailsResponse.statusCode).toBe(401);
      const body = getUserDetailsResponse.body;
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
