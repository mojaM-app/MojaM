import { events } from '@events';
import { errorKeys, UnauthorizedException } from '@exceptions';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, GetUserProfileResponseDto, IGetUserProfileDto, UserProfileRoute, UserRoute } from '@modules/users';
import { generateRandomDate, getAdminLoginData } from '@utils';
import { testUtils } from '@helpers';
import request from 'supertest';
import { TestApp } from './../../../helpers/tests.utils';

describe('GET/user-profile', () => {
  const userProfileRoute = new UserProfileRoute();
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testUtils.getTestApp([userRoute, permissionsRoute, userProfileRoute]);
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await testUtils.loginAs(app, { email, passcode } satisfies LoginDto))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('GET should respond with a status code of 200', () => {
    test('when data are valid', async () => {
      const newUser = {
        ...testUtils.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app!.getServer())
        .post(userRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testUtils.loginAs(app!, { email: newUser.email, passcode: newUser.passcode } satisfies LoginDto))
        ?.accessToken;

      const getUserProfileResponse = await request(app!.getServer())
        .get(userProfileRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
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

      const deleteResponse = await request(app!.getServer())
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
      const requestData = testUtils.generateValidUserWithPassword();
      const createUserResponse = await request(app!.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testUtils.loginAs(app!, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))
        ?.accessToken;

      const getUserProfileResponse = await request(app!.getServer())
        .get(userProfileRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(200);

      const deleteResponse = await request(app!.getServer())
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
        ...testUtils.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app!.getServer())
        .post(userRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(userRoute.path + '/' + newUserDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testUtils.loginAs(app!, { email: newUser.email, passcode: newUser.passcode } satisfies LoginDto))
        ?.accessToken;

      const deleteResponse = await request(app!.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      const getUserProfileResponse = await request(app!.getServer())
        .get(userProfileRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
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
  });

  describe('GET should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const getUserProfileResponse = await request(app!.getServer()).get(userProfileRoute.path).send();
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

  describe('GET should respond with a status code of 404', () => {
    test('GET should respond with a status code of 404 when path is invalid', async () => {
      const getUserProfileResponse = await request(app!.getServer())
        .get(userProfileRoute.path + '/invalid-path')
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

  describe('GET should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const getUserProfileResponse = await request(app!.getServer())
        .get(userProfileRoute.path)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
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

  afterAll(async () => {
    await testUtils.closeTestApp();
    jest.resetAllMocks();
  });
});
