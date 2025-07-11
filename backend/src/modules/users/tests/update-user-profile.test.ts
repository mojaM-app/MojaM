import { events, ILoginModel } from '@core';
import { errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { userTestHelpers } from '@modules/users';
import { generateRandomDate, getAdminLoginData } from '@utils';
import request from 'supertest';
import Container from 'typedi';
import { CreateUserResponseDto } from '../dtos/create-user.dto';
import { GetUserProfileResponseDto } from '../dtos/get-user-profile.dto';
import { UpdateUserProfileDto, UpdateUserProfileResponseDto } from '../dtos/update-user-profile.dto';
import { UserProfileRoute } from '../routes/user-profile.routes';
import { UserRoute } from '../routes/user.routes';
import { UserProfileService } from '../services/user-profile.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { TestApp } from './../../../helpers/tests.utils';

describe('PUT/user-profile', () => {
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

  describe('PUT should respond with a status code of 200', () => {
    test('when data (firstName and lastName) are valid', async () => {
      const newUser = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: newUser.email, passcode: newUser.passcode } satisfies ILoginModel))
        ?.accessToken;

      const updateModel = {
        firstName: 'Average',
        lastName: 'Joe',
      } satisfies UpdateUserProfileDto;
      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send(updateModel)
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(updateUserProfileResponse.statusCode).toBe(200);
      const { data: updateResult, message: updateMessage }: UpdateUserProfileResponseDto = updateUserProfileResponse.body;
      expect(updateResult).toBe(true);
      expect(updateMessage).toBe(events.users.userProfileUpdated);

      const getUserProfileResponse = await request(app!.getServer())
        .get(UserProfileRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(200);
      const { data: userProfile }: GetUserProfileResponseDto = getUserProfileResponse.body;
      expect(userProfile!.email).toBe(newUserDto.email);
      expect(userProfile!.phone).toBe(newUserDto.phone);
      userProfile!.joiningDate = new Date(userProfile!.joiningDate!);
      expect(userProfile!.joiningDate.toDateString()).toEqual(newUser.joiningDate.toDateString());
      expect(userProfile!.firstName).toBe(updateModel.firstName);
      expect(userProfile!.lastName).toBe(updateModel.lastName);

      const deleteResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
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
              testEventHandlers.onUserProfileUpdated,
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
      expect(testEventHandlers.onUserProfileUpdated).toHaveBeenCalledTimes(1);
    });

    test('when user has no permissions (permissions are not needed)', async () => {
      const newUser = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = body;
      expect(newUserDto?.id).toBeDefined();
      expect(newUserDto?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: newUser.email, passcode: newUser.passcode } satisfies ILoginModel))
        ?.accessToken;

      const updateModel = {
        firstName: 'Average',
        lastName: 'Joe',
      } satisfies UpdateUserProfileDto;
      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send(updateModel)
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(updateUserProfileResponse.statusCode).toBe(200);
      body = updateUserProfileResponse.body;
      const { data: updateResult, message: updateMessage }: UpdateUserProfileResponseDto = body;
      expect(updateResult).toBe(true);
      expect(updateMessage).toBe(events.users.userProfileUpdated);

      const getUserProfileResponse = await request(app!.getServer())
        .get(UserProfileRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(200);
      body = getUserProfileResponse.body;
      const { data: userProfile }: GetUserProfileResponseDto = body;
      expect(userProfile!.firstName).toBe(updateModel.firstName);
      expect(userProfile!.lastName).toBe(updateModel.lastName);

      const deleteResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
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
              testEventHandlers.onUserProfileUpdated,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserProfileUpdated).toHaveBeenCalled();
      expect(testEventHandlers.onUserProfileRetrieved).toHaveBeenCalled();
    });

    test('when firstName and lastName are undefined firstName and lastName should stay unchanged', async () => {
      const newUser = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: newUser.email, passcode: newUser.passcode } satisfies ILoginModel))
        ?.accessToken;

      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send({
          firstName: undefined,
          lastName: undefined,
        } satisfies UpdateUserProfileDto)
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(updateUserProfileResponse.statusCode).toBe(200);
      const { data: updateResult, message: updateMessage }: UpdateUserProfileResponseDto = updateUserProfileResponse.body;
      expect(updateResult).toBe(true);
      expect(updateMessage).toBe(events.users.userProfileUpdated);

      const getUserProfileResponse = await request(app!.getServer())
        .get(UserProfileRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(200);
      const { data: userProfile }: GetUserProfileResponseDto = getUserProfileResponse.body;
      expect(userProfile!.email).toBe(newUserDto.email);
      expect(userProfile!.phone).toBe(newUserDto.phone);
      userProfile!.joiningDate = new Date(userProfile!.joiningDate!);
      expect(userProfile!.joiningDate.toDateString()).toEqual(newUser.joiningDate.toDateString());
      expect(userProfile!.firstName).toBe(newUser.firstName);
      expect(userProfile!.lastName).toBe(newUser.lastName);

      const deleteResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
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
              testEventHandlers.onUserProfileUpdated,
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
      expect(testEventHandlers.onUserProfileUpdated).toHaveBeenCalledTimes(1);
    });

    test('when firstName and lastName are null firstName and lastName should be null', async () => {
      const newUser = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: newUser.email, passcode: newUser.passcode } satisfies ILoginModel))
        ?.accessToken;

      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send({
          firstName: null,
          lastName: null,
        } satisfies UpdateUserProfileDto)
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(updateUserProfileResponse.statusCode).toBe(200);
      const { data: updateResult, message: updateMessage }: UpdateUserProfileResponseDto = updateUserProfileResponse.body;
      expect(updateResult).toBe(true);
      expect(updateMessage).toBe(events.users.userProfileUpdated);

      const getUserProfileResponse = await request(app!.getServer())
        .get(UserProfileRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(200);
      const { data: userProfile }: GetUserProfileResponseDto = getUserProfileResponse.body;
      expect(userProfile!.email).toBe(newUserDto.email);
      expect(userProfile!.phone).toBe(newUserDto.phone);
      userProfile!.joiningDate = new Date(userProfile!.joiningDate!);
      expect(userProfile!.joiningDate.toDateString()).toEqual(newUser.joiningDate.toDateString());
      expect(userProfile!.firstName).toBeNull();
      expect(userProfile!.lastName).toBeNull();

      const deleteResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
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
              testEventHandlers.onUserProfileUpdated,
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
      expect(testEventHandlers.onUserProfileUpdated).toHaveBeenCalledTimes(1);
    });

    test('when firstName and lastName are empty firstName and lastName should be null', async () => {
      const newUser = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: newUser.email, passcode: newUser.passcode } satisfies ILoginModel))
        ?.accessToken;

      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send({
          firstName: '',
          lastName: '',
        } satisfies UpdateUserProfileDto)
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(updateUserProfileResponse.statusCode).toBe(200);
      const { data: updateResult, message: updateMessage }: UpdateUserProfileResponseDto = updateUserProfileResponse.body;
      expect(updateResult).toBe(true);
      expect(updateMessage).toBe(events.users.userProfileUpdated);

      const getUserProfileResponse = await request(app!.getServer())
        .get(UserProfileRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(200);
      const { data: userProfile }: GetUserProfileResponseDto = getUserProfileResponse.body;
      expect(userProfile!.email).toBe(newUserDto.email);
      expect(userProfile!.phone).toBe(newUserDto.phone);
      userProfile!.joiningDate = new Date(userProfile!.joiningDate!);
      expect(userProfile!.joiningDate.toDateString()).toEqual(newUser.joiningDate.toDateString());
      expect(userProfile!.firstName).toBeNull();
      expect(userProfile!.lastName).toBeNull();

      const deleteResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
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
              testEventHandlers.onUserProfileUpdated,
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
      expect(testEventHandlers.onUserProfileUpdated).toHaveBeenCalledTimes(1);
    });

    test('when joiningDate are null joiningDate should be null', async () => {
      const newUser = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: newUser.email, passcode: newUser.passcode } satisfies ILoginModel))
        ?.accessToken;

      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send({
          joiningDate: null,
        } satisfies UpdateUserProfileDto)
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(updateUserProfileResponse.statusCode).toBe(200);
      const { data: updateResult, message: updateMessage }: UpdateUserProfileResponseDto = updateUserProfileResponse.body;
      expect(updateResult).toBe(true);
      expect(updateMessage).toBe(events.users.userProfileUpdated);

      const getUserProfileResponse = await request(app!.getServer())
        .get(UserProfileRoute.path)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(getUserProfileResponse.statusCode).toBe(200);
      const { data: userProfile }: GetUserProfileResponseDto = getUserProfileResponse.body;
      expect(userProfile!.joiningDate).toBeNull();

      const deleteResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
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
              testEventHandlers.onUserProfileUpdated,
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
      expect(testEventHandlers.onUserProfileUpdated).toHaveBeenCalledTimes(1);
    });
  });

  describe('PUT should respond with a status code of 401', () => {
    test('when try to update profile that not exist', async () => {
      const newUser = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'John',
        lastName: 'Doe',
        joiningDate: generateRandomDate(),
      };
      const createUserResponse = await request(app!.getServer())
        .post(UserRoute.path)
        .send(newUser)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app!.getServer())
        .post(UserRoute.path + '/' + newUserDto.id + '/' + UserRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await testHelpers.loginAs(app!, { email: newUser.email, passcode: newUser.passcode } satisfies ILoginModel))
        ?.accessToken;

      const deleteResponse = await request(app!.getServer())
        .delete(UserRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send({
          firstName: 'Average',
          lastName: 'Joe',
        } satisfies UpdateUserProfileDto)
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(updateUserProfileResponse.statusCode).toBe(401);
      const body = updateUserProfileResponse.body;
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
      expect(testEventHandlers.onUserProfileUpdated).not.toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when token is invalid', async () => {
      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send({
          firstName: 'John',
          lastName: 'Doe',
        } satisfies UpdateUserProfileDto)
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(updateUserProfileResponse.statusCode).toBe(401);
      const body = updateUserProfileResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('PUT should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send({
          firstName: 'John',
          lastName: 'Doe',
        } satisfies UpdateUserProfileDto);
      expect(updateUserProfileResponse.statusCode).toBe(401);
      const body = updateUserProfileResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('PUT should respond with a status code of 404', () => {
    test('PUT should respond with a status code of 404 when path is invalid', async () => {
      const updateUserProfileResponse = await request(app!.getServer())
        .put(UserProfileRoute.path + '/invalid-path')
        .send({
          firstName: 'John',
          lastName: 'Doe',
        } satisfies UpdateUserProfileDto)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateUserProfileResponse.statusCode).toBe(404);
      expect(updateUserProfileResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = updateUserProfileResponse.body;
      expect(typeof body).toBe('object');
      const { message: deleteMessage }: { message: string } = body;
      expect(deleteMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('PUT should respond with a status code of 500', () => {
    it('when service throws an error', async () => {
      const userProfileService = Container.get(UserProfileService);
      const mockGet = jest.spyOn(userProfileService, 'update').mockRejectedValue(new Error('Service error'));
      const updateModel = {
        firstName: 'Average',
        lastName: 'Joe',
      } satisfies UpdateUserProfileDto;
      const response = await request(app!.getServer())
        .put(UserProfileRoute.path)
        .send(updateModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
