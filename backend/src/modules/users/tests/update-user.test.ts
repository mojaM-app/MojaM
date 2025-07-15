import { VALIDATOR_SETTINGS } from '@config';
import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { userTestHelpers } from '@modules/users';
import { generateRandomDate, generateRandomNumber, getAdminLoginData } from '@utils';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateUserDto, CreateUserResponseDto } from '../dtos/create-user.dto';
import { GetUserDetailsResponseDto } from '../dtos/get-user-details.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('PUT /user/:id', () => {
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

  describe('PUT should respond with a status code of 200', () => {
    test('when all data are passed but only firstName is changed', async () => {
      const createUserRequestData = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'Bob',
        lastName: 'Smith',
        joiningDate: generateRandomDate(),
      } satisfies CreateUserDto;
      const createUserResponse = await app!.user.create(createUserRequestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body: CreateUserResponseDto | GetUserDetailsResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const updateUserRequestData = {
        ...createUserRequestData,
        firstName: 'Bob2',
      } satisfies UpdateUserDto;
      const updateUserResponse = await app!.user.update(newUser.id, updateUserRequestData, adminAccessToken);
      expect(updateUserResponse.statusCode).toBe(200);

      const getUserResponse = await app!.user.get(newUser.id, adminAccessToken);
      expect(getUserResponse.statusCode).toBe(200);
      body = getUserResponse.body as GetUserDetailsResponseDto;
      expect(typeof body).toBe('object');
      const { data: user, message: getMessage }: GetUserDetailsResponseDto = body;
      expect(getMessage).toBe(events.users.userRetrieved);
      expect(user).toBeDefined();
      expect(user!.id).toBe(newUser.id);
      expect(user!.email).toBe(updateUserRequestData.email);
      expect(user!.phone).toBe(updateUserRequestData.phone);
      expect(user!.firstName).toBe(updateUserRequestData.firstName);
      expect(user!.lastName).toBe(updateUserRequestData.lastName);
      expect(new Date(user!.joiningDate!).toDateString()).toEqual(updateUserRequestData.joiningDate.toDateString());

      const deleteUserResponse = await app!.user.delete(newUser.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserUpdated,
              testEventHandlers.onUserRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when all data are passed but only joiningDate is changed', async () => {
      const createUserRequestData = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'Bob',
        lastName: 'Smith',
        joiningDate: generateRandomDate(),
      } satisfies CreateUserDto;
      const createUserResponse = await app!.user.create(createUserRequestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body: CreateUserResponseDto | GetUserDetailsResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const updateUserRequestData = {
        ...createUserRequestData,
        joiningDate: generateRandomDate(),
      } satisfies UpdateUserDto;
      const updateUserResponse = await app!.user.update(newUser.id, updateUserRequestData, adminAccessToken);
      expect(updateUserResponse.statusCode).toBe(200);

      const getUserResponse = await app!.user.get(newUser.id, adminAccessToken);
      expect(getUserResponse.statusCode).toBe(200);
      body = getUserResponse.body as GetUserDetailsResponseDto;
      expect(typeof body).toBe('object');
      const { data: user, message: getMessage }: GetUserDetailsResponseDto = body;
      expect(getMessage).toBe(events.users.userRetrieved);
      expect(user).toBeDefined();
      expect(user!.id).toBe(newUser.id);
      expect(user!.email).toBe(updateUserRequestData.email);
      expect(user!.phone).toBe(updateUserRequestData.phone);
      expect(user!.firstName).toBe(updateUserRequestData.firstName);
      expect(user!.lastName).toBe(updateUserRequestData.lastName);
      expect(new Date(user!.joiningDate!).toDateString()).toEqual(updateUserRequestData.joiningDate.toDateString());

      const deleteUserResponse = await app!.user.delete(newUser.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserUpdated,
              testEventHandlers.onUserRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when only email case is changed', async () => {
      const createUserRequestData = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'Bob',
        lastName: 'Smith',
      } satisfies CreateUserDto;
      createUserRequestData.email = createUserRequestData.email.toLocaleLowerCase();
      const createUserResponse = await app!.user.create(
        {
          ...createUserRequestData,
          email: createUserRequestData.email.toLocaleLowerCase(),
        } satisfies CreateUserDto,
        adminAccessToken,
      );
      expect(createUserResponse.statusCode).toBe(201);
      let body: CreateUserResponseDto | GetUserDetailsResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const updateUserRequestData = {
        ...createUserRequestData,
        email: createUserRequestData.email.toLocaleUpperCase(),
      } satisfies UpdateUserDto;
      const updateUserResponse = await app!.user.update(newUser.id, updateUserRequestData, adminAccessToken);
      expect(updateUserResponse.statusCode).toBe(200);

      const getUserResponse = await app!.user.get(newUser.id, adminAccessToken);
      expect(getUserResponse.statusCode).toBe(200);
      body = getUserResponse.body as GetUserDetailsResponseDto;
      expect(typeof body).toBe('object');
      const { data: user, message: getMessage }: GetUserDetailsResponseDto = body;
      expect(getMessage).toBe(events.users.userRetrieved);
      expect(user).toBeDefined();
      expect(user!.id).toBe(newUser.id);
      expect(user!.email).toBe(updateUserRequestData.email);
      expect(user!.phone).toBe(updateUserRequestData.phone);
      expect(user!.firstName).toBe(updateUserRequestData.firstName);
      expect(user!.lastName).toBe(updateUserRequestData.lastName);

      const deleteUserResponse = await app!.user.delete(newUser.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserUpdated,
              testEventHandlers.onUserRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when only password is updated nothing should change (password should not be changed)', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateUserResponse.statusCode).toBe(200);

      const accessToken1 = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;
      expect(accessToken1).toBeDefined();

      const updateUserResponse = await app!.user.update(
        user.id,
        { passcode: 'strongPassword1@' } as any,
        adminAccessToken,
      );
      expect(updateUserResponse.statusCode).toBe(200);

      const accessToken2 = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;
      expect(accessToken2).toBeDefined();

      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserUpdated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserUpdated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when firstName is set to null', async () => {
      const createUserRequestData = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'Bob',
      } satisfies CreateUserDto;
      const createUserResponse = await app!.user.create(createUserRequestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body: CreateUserResponseDto | GetUserDetailsResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const updateUserRequestData = {
        ...createUserRequestData,
        firstName: null,
      } satisfies UpdateUserDto;
      const updateUserResponse = await app!.user.update(newUser.id, updateUserRequestData, adminAccessToken);
      expect(updateUserResponse.statusCode).toBe(200);

      const getUserResponse = await app!.user.get(newUser.id, adminAccessToken);
      expect(getUserResponse.statusCode).toBe(200);
      body = getUserResponse.body as GetUserDetailsResponseDto;
      expect(typeof body).toBe('object');
      const { data: user, message: getMessage }: GetUserDetailsResponseDto = body;
      expect(getMessage).toBe(events.users.userRetrieved);
      expect(user).toBeDefined();
      expect(user!.id).toBe(newUser.id);
      expect(user!.email).toBe(updateUserRequestData.email);
      expect(user!.phone).toBe(updateUserRequestData.phone);
      expect(user!.firstName).toBeNull();

      const deleteUserResponse = await app!.user.delete(newUser.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserUpdated,
              testEventHandlers.onUserRetrieved,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('PUT should respond with a status code of 400', () => {
    test('when email is invalid', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateUserResponse.statusCode).toBe(200);

      [
        'email.dom' + 'a'.repeat(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH) + 'in.com',
        'email@',
        '@email',
        'invalid email',
        '',
        null as any,
      ].forEach(async email => {
        const updateUserResponse = await app!.user.update(user.id, { email } satisfies UpdateUserDto, adminAccessToken);
        expect(updateUserResponse.statusCode).toBe(400);
        body = updateUserResponse.body;
        expect(typeof body).toBe('object');
        const { message: updateUserResponseMessage } = body.data as BadRequestException;
        const errors = updateUserResponseMessage.split(',');
        expect(errors.filter(x => !x.includes('Email')).length).toBe(0);
      });

      const deleteBobResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteBobResponse.statusCode).toBe(200);

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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when phone is invalid', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateUserResponse.statusCode).toBe(200);

      [generateRandomNumber(VALIDATOR_SETTINGS.PHONE_MAX_LENGTH + 1), '123', 'invalid phone', '', null as any].forEach(
        async phone => {
          const updateUserResponse = await app!.user.update(
            user.id,
            { phone } satisfies UpdateUserDto,
            adminAccessToken,
          );
          expect(updateUserResponse.statusCode).toBe(400);
          body = updateUserResponse.body;
          expect(typeof body).toBe('object');
          const { message: updateUserResponseMessage } = body.data as BadRequestException;
          const errors = updateUserResponseMessage.split(',');
          expect(errors.filter(x => !x.includes('Phone')).length).toBe(0);
        },
      );

      const deleteBobResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteBobResponse.statusCode).toBe(200);

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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when first name is invalid', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateUserResponse.statusCode).toBe(200);

      ['a'.repeat(VALIDATOR_SETTINGS.NAME_MAX_LENGTH + 1)].forEach(async firstName => {
        const updateUserResponse = await app!.user.update(
          user.id,
          { firstName } satisfies UpdateUserDto,
          adminAccessToken,
        );
        expect(updateUserResponse.statusCode).toBe(400);
        body = updateUserResponse.body;
        expect(typeof body).toBe('object');
        const { message: updateUserResponseMessage } = body.data as BadRequestException;
        const errors = updateUserResponseMessage.split(',');
        expect(errors.filter(x => !x.includes('FirstName')).length).toBe(0);
      });

      const deleteBobResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteBobResponse.statusCode).toBe(200);

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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when last name is invalid', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateUserResponse.statusCode).toBe(200);

      ['a'.repeat(VALIDATOR_SETTINGS.NAME_MAX_LENGTH + 1)].forEach(async lastName => {
        const updateUserResponse = await app!.user.update(
          user.id,
          { lastName } satisfies UpdateUserDto,
          adminAccessToken,
        );
        expect(updateUserResponse.statusCode).toBe(400);
        body = updateUserResponse.body;
        expect(typeof body).toBe('object');
        const { message: updateUserResponseMessage } = body.data as BadRequestException;
        const errors = updateUserResponseMessage.split(',');
        expect(errors.filter(x => !x.includes('LastName')).length).toBe(0);
      });

      const deleteBobResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteBobResponse.statusCode).toBe(200);

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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when tries to set up someone else`s email and phone number', async () => {
      const requestData1 = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse1 = await app!.user.create(requestData1, adminAccessToken);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user1 }: CreateUserResponseDto = createUserResponse1.body;

      const requestData2 = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse2 = await app!.user.create(requestData2, adminAccessToken);
      expect(createUserResponse2.statusCode).toBe(201);
      const { data: user2 }: CreateUserResponseDto = createUserResponse2.body;

      const updateUserResponse = await app!.user.update(
        user1.id,
        {
          email: user2.email,
          phone: user2.phone,
        } satisfies UpdateUserDto,
        adminAccessToken,
      );
      expect(updateUserResponse.statusCode).toBe(400);
      const body = updateUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: updateMessage, args: updateArgs } = data;
      expect(updateMessage).toBe(errorKeys.users.User_Already_Exists);
      expect(updateArgs).toStrictEqual({
        email: user2.email,
        phone: user2.phone,
      });

      let deleteUserResponse = await app!.user.delete(user1.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      deleteUserResponse = await app!.user.delete(user2.id, adminAccessToken);
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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });

    test('when tries to set up someone else`s email and phone number by only changing the e-mail', async () => {
      const requestData1 = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse1 = await app!.user.create(requestData1, adminAccessToken);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user1 }: CreateUserResponseDto = createUserResponse1.body;

      const requestData2 = userTestHelpers.generateValidUserWithPassword();
      requestData2.phone = user1.phone;

      const createUserResponse2 = await app!.user.create(requestData2, adminAccessToken);
      expect(createUserResponse2.statusCode).toBe(201);
      const { data: user2 }: CreateUserResponseDto = createUserResponse2.body;

      expect(user2.email).not.toBe(user1.email);
      expect(user2.phone).toBe(user1.phone);

      const updateUserResponse = await app!.user.update(
        user1.id,
        {
          email: user2.email,
        } satisfies UpdateUserDto,
        adminAccessToken,
      );
      expect(updateUserResponse.statusCode).toBe(400);
      const body = updateUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: updateMessage, args: updateArgs } = data;
      expect(updateMessage).toBe(errorKeys.users.User_Already_Exists);
      expect(updateArgs).toStrictEqual({
        email: user2.email,
        phone: user2.phone,
      });

      let deleteUserResponse = await app!.user.delete(user1.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      deleteUserResponse = await app!.user.delete(user2.id, adminAccessToken);
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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });

    test('when tries to set up someone else`s email and phone number by only changing the phone number', async () => {
      const requestData1 = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse1 = await app!.user.create(requestData1, adminAccessToken);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user1 }: CreateUserResponseDto = createUserResponse1.body;

      const requestData2 = userTestHelpers.generateValidUserWithPassword();
      requestData2.email = user1.email;

      const createUserResponse2 = await app!.user.create(requestData2, adminAccessToken);
      expect(createUserResponse2.statusCode).toBe(201);
      const { data: user2 }: CreateUserResponseDto = createUserResponse2.body;

      expect(user2.email).toBe(user1.email);
      expect(user2.phone).not.toBe(user1.phone);

      const updateUserResponse = await app!.user.update(
        user1.id,
        {
          phone: user2.phone,
        } satisfies UpdateUserDto,
        adminAccessToken,
      );
      expect(updateUserResponse.statusCode).toBe(400);
      const body = updateUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: updateMessage, args: updateArgs } = data;
      expect(updateMessage).toBe(errorKeys.users.User_Already_Exists);
      expect(updateArgs).toStrictEqual({
        email: user2.email,
        phone: user2.phone,
      });

      let deleteUserResponse = await app!.user.delete(user1.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      deleteUserResponse = await app!.user.delete(user2.id, adminAccessToken);
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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });

    test('when tries to set up someone else`s email and phone number (different letters size)', async () => {
      const requestData1 = userTestHelpers.generateValidUserWithPassword();
      requestData1.email = requestData1.email.toLocaleLowerCase();
      const createUserResponse1 = await app!.user.create(requestData1, adminAccessToken);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user1 }: CreateUserResponseDto = createUserResponse1.body;

      const requestData2 = userTestHelpers.generateValidUserWithPassword();
      requestData2.email = requestData2.email.toLocaleLowerCase();
      const createUserResponse2 = await app!.user.create(requestData2, adminAccessToken);
      expect(createUserResponse2.statusCode).toBe(201);
      const { data: user2 }: CreateUserResponseDto = createUserResponse2.body;

      const updateUserResponse = await app!.user.update(
        user1.id,
        {
          email: user2.email.toLocaleUpperCase(),
          phone: user2.phone,
        } satisfies UpdateUserDto,
        adminAccessToken,
      );
      expect(updateUserResponse.statusCode).toBe(400);
      const body = updateUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: updateMessage, args: updateArgs } = data;
      expect(updateMessage).toBe(errorKeys.users.User_Already_Exists);
      expect(updateArgs).toStrictEqual({
        email: user2.email.toLocaleUpperCase(),
        phone: user2.phone,
      });

      let deleteUserResponse = await app!.user.delete(user1.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      deleteUserResponse = await app!.user.delete(user2.id, adminAccessToken);
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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });

    test('when tries to update user that not exist', async () => {
      const createUserRequestData = {
        ...userTestHelpers.generateValidUserWithPassword(),
        firstName: 'Bob',
      } satisfies CreateUserDto;
      const createUserResponse = await app!.user.create(createUserRequestData, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const body: CreateUserResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const deleteUserResponse = await app!.user.delete(newUser.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      const updateUserRequestData = {
        ...createUserRequestData,
      } satisfies UpdateUserDto;
      const updateUserResponse = await app!.user.update(newUser.id, updateUserRequestData, adminAccessToken);
      expect(updateUserResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });
  });

  describe('PUT should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const admin = getAdminLoginData();
      const updateUserResponse = await app!.user.update(admin.uuid, userTestHelpers.generateValidUserWithPassword());
      expect(updateUserResponse.statusCode).toBe(401);
      const body = updateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const newUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;
      const admin = getAdminLoginData();

      const updateUserResponse = await app!.user.update(
        admin.uuid,
        userTestHelpers.generateValidUserWithPassword(),
        newUserAccessToken,
      );
      expect(updateUserResponse.statusCode).toBe(403);
      expect(updateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });

    test('when user have all permissions expect EditUser', async () => {
      const requestData = userTestHelpers.generateValidUserWithPassword();
      const newUserResponse = await app!.user.create(requestData, adminAccessToken);
      expect(newUserResponse.statusCode).toBe(201);
      let body: any = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(user.id, adminAccessToken, [
        SystemPermissions.EditUser,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({
          email: requestData.email,
          passcode: requestData.passcode,
        } satisfies ILoginModel)
      )?.accessToken;
      const admin = getAdminLoginData();

      const updateUserResponse = await app!.user.update(
        admin.uuid,
        userTestHelpers.generateValidUserWithPassword(),
        newUserAccessToken,
      );
      expect(updateUserResponse.statusCode).toBe(403);
      expect(updateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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
              testEventHandlers.onPermissionAdded,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });
  });

  describe('PUT should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const requestData = getAdminLoginData();
      const response = await app!.user.update(requestData.uuid, requestData, `invalid_token_${adminAccessToken}`);
      expect(response.statusCode).toBe(401);
      const body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when try to use token from user that not exists', async () => {
      const userBob = userTestHelpers.generateValidUserWithPassword();

      const createBobResponse = await app!.user.create(userBob, adminAccessToken);
      expect(createBobResponse.statusCode).toBe(201);
      const { data: bobDto, message: bobCreateMessage }: CreateUserResponseDto = createBobResponse.body;
      expect(bobDto?.id).toBeDefined();
      expect(bobCreateMessage).toBe(events.users.userCreated);

      const activateBobResponse = await app!.user.activate(bobDto.id, adminAccessToken);
      expect(activateBobResponse.statusCode).toBe(200);

      const bobAccessToken = (
        await app!.auth.loginAs({ email: bobDto.email, passcode: userBob.passcode } satisfies ILoginModel)
      )?.accessToken;

      const deleteBobResponse = await app!.user.delete(bobDto.id, adminAccessToken);
      expect(deleteBobResponse.statusCode).toBe(200);

      const admin = getAdminLoginData();

      const updateUserUsingBobAccessTokenResponse = await app!.user.update(
        admin.uuid,
        userTestHelpers.generateValidUserWithPassword(),
        bobAccessToken,
      );
      expect(updateUserUsingBobAccessTokenResponse.statusCode).toBe(401);
      expect(updateUserUsingBobAccessTokenResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = updateUserUsingBobAccessTokenResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as UnauthorizedException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Wrong_Authentication_Token);
      expect(loginArgs).toBeUndefined();

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
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
