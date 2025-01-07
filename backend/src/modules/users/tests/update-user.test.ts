/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import { CreateUserDto, CreateUserResponseDto, GetUserDetailsResponseDto, UpdateUserDto, UserRoute } from '@modules/users';
import { isNumber, VALIDATOR_SETTINGS } from '@utils';
import { generateRandomDate, generateRandomNumber, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import request from 'supertest';

describe('PUT /user/:id', () => {
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();

  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute]);
    const { email, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('PUT should respond with a status code of 200', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when all data are passed but only firstName is changed', async () => {
      const createUserRequestData = {
        ...generateValidUser(),
        firstName: 'Bob',
        lastName: 'Smith',
        joiningDate: generateRandomDate(),
      } satisfies CreateUserDto;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(createUserRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body: CreateUserResponseDto | GetUserDetailsResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const updateUserRequestData = {
        ...createUserRequestData,
        firstName: 'Bob2',
      } satisfies UpdateUserDto;
      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + newUser.id)
        .send(updateUserRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateUserResponse.statusCode).toBe(200);

      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + newUser.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
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
      expect(new Date(user!.joiningDate!)).toEqual(updateUserRequestData.joiningDate);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

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
        ...generateValidUser(),
        firstName: 'Bob',
        lastName: 'Smith',
        joiningDate: generateRandomDate(),
      } satisfies CreateUserDto;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(createUserRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body: CreateUserResponseDto | GetUserDetailsResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const updateUserRequestData = {
        ...createUserRequestData,
        joiningDate: generateRandomDate(),
      } satisfies UpdateUserDto;
      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + newUser.id)
        .send(updateUserRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateUserResponse.statusCode).toBe(200);

      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + newUser.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
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
      expect(new Date(user!.joiningDate!)).toEqual(updateUserRequestData.joiningDate);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

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
        ...generateValidUser(),
        firstName: 'Bob',
        lastName: 'Smith',
      } satisfies CreateUserDto;
      createUserRequestData.email = createUserRequestData.email.toLocaleLowerCase();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send({
          ...createUserRequestData,
          email: createUserRequestData.email.toLocaleLowerCase(),
        } satisfies CreateUserDto)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body: CreateUserResponseDto | GetUserDetailsResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const updateUserRequestData = {
        ...createUserRequestData,
        email: createUserRequestData.email.toLocaleUpperCase(),
      } satisfies UpdateUserDto;
      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + newUser.id)
        .send(updateUserRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateUserResponse.statusCode).toBe(200);

      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + newUser.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
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

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

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

    test('when only password is updated nothing should change', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const accessToken1 = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;
      expect(accessToken1).toBeDefined();

      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + user.id)
        .send({ password: 'strongPassword1@' })
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateUserResponse.statusCode).toBe(200);

      const accessToken2 = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;
      expect(accessToken2).toBeDefined();

      expect(accessToken1).toBe(accessToken2);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
        ...generateValidUser(),
        firstName: 'Bob',
      } satisfies CreateUserDto;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(createUserRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body: CreateUserResponseDto | GetUserDetailsResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const updateUserRequestData = {
        ...createUserRequestData,
        firstName: null,
      } satisfies UpdateUserDto;
      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + newUser.id)
        .send(updateUserRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateUserResponse.statusCode).toBe(200);

      const getUserResponse = await request(app.getServer())
        .get(userRoute.path + '/' + newUser.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
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

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when email is invalid', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      ['email.dom' + 'a'.repeat(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH) + 'in.com', 'email@', '@email', 'invalid email', '', null as any].forEach(
        async email => {
          const updateUserResponse = await request(app.getServer())
            .put(userRoute.path + '/' + user.id)
            .send({ email } satisfies UpdateUserDto)
            .set('Authorization', `Bearer ${adminAccessToken}`);
          expect(updateUserResponse.statusCode).toBe(400);
          body = updateUserResponse.body;
          expect(typeof body).toBe('object');
          const { message: updateUserResponseMessage } = body.data as BadRequestException;
          const errors = updateUserResponseMessage.split(',');
          expect(errors.filter(x => !x.includes('Email')).length).toBe(0);
        },
      );

      const deleteBobResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteBobResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when phone is invalid', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      [generateRandomNumber(VALIDATOR_SETTINGS.PHONE_MAX_LENGTH + 1), '123', 'invalid phone', '', null as any].forEach(async phone => {
        const updateUserResponse = await request(app.getServer())
          .put(userRoute.path + '/' + user.id)
          .send({ phone } satisfies UpdateUserDto)
          .set('Authorization', `Bearer ${adminAccessToken}`);
        expect(updateUserResponse.statusCode).toBe(400);
        body = updateUserResponse.body;
        expect(typeof body).toBe('object');
        const { message: updateUserResponseMessage } = body.data as BadRequestException;
        const errors = updateUserResponseMessage.split(',');
        expect(errors.filter(x => !x.includes('Phone')).length).toBe(0);
      });

      const deleteBobResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteBobResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when first name is invalid', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      ['a'.repeat(VALIDATOR_SETTINGS.NAME_MAX_LENGTH + 1)].forEach(async firstName => {
        const updateUserResponse = await request(app.getServer())
          .put(userRoute.path + '/' + user.id)
          .send({ firstName } satisfies UpdateUserDto)
          .set('Authorization', `Bearer ${adminAccessToken}`);
        expect(updateUserResponse.statusCode).toBe(400);
        body = updateUserResponse.body;
        expect(typeof body).toBe('object');
        const { message: updateUserResponseMessage } = body.data as BadRequestException;
        const errors = updateUserResponseMessage.split(',');
        expect(errors.filter(x => !x.includes('FirstName')).length).toBe(0);
      });

      const deleteBobResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteBobResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when last name is invalid', async () => {
      const requestData = generateValidUser();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      ['a'.repeat(VALIDATOR_SETTINGS.NAME_MAX_LENGTH + 1)].forEach(async lastName => {
        const updateUserResponse = await request(app.getServer())
          .put(userRoute.path + '/' + user.id)
          .send({ lastName } satisfies UpdateUserDto)
          .set('Authorization', `Bearer ${adminAccessToken}`);
        expect(updateUserResponse.statusCode).toBe(400);
        body = updateUserResponse.body;
        expect(typeof body).toBe('object');
        const { message: updateUserResponseMessage } = body.data as BadRequestException;
        const errors = updateUserResponseMessage.split(',');
        expect(errors.filter(x => !x.includes('LastName')).length).toBe(0);
      });

      const deleteBobResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteBobResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserActivated, testEventHandlers.onUserDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when tries to set up someone else`s email and phone number', async () => {
      const requestData1 = generateValidUser();
      const createUserResponse1 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user1 }: CreateUserResponseDto = createUserResponse1.body;

      const requestData2 = generateValidUser();
      const createUserResponse2 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse2.statusCode).toBe(201);
      const { data: user2 }: CreateUserResponseDto = createUserResponse2.body;

      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + user1.id)
        .send({
          email: user2.email,
          phone: user2.phone,
        })
        .set('Authorization', `Bearer ${adminAccessToken}`);
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

      let deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user1.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user2.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });

    test('when tries to set up someone else`s email and phone number by only changing the e-mail', async () => {
      const requestData1 = generateValidUser();
      const createUserResponse1 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user1 }: CreateUserResponseDto = createUserResponse1.body;

      const requestData2 = generateValidUser();
      requestData2.phone = user1.phone;

      const createUserResponse2 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse2.statusCode).toBe(201);
      const { data: user2 }: CreateUserResponseDto = createUserResponse2.body;

      expect(user2.email).not.toBe(user1.email);
      expect(user2.phone).toBe(user1.phone);

      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + user1.id)
        .send({
          email: user2.email,
        })
        .set('Authorization', `Bearer ${adminAccessToken}`);
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

      let deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user1.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user2.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });

    test('when tries to set up someone else`s email and phone number by only changing the phone number', async () => {
      const requestData1 = generateValidUser();
      const createUserResponse1 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user1 }: CreateUserResponseDto = createUserResponse1.body;

      const requestData2 = generateValidUser();
      requestData2.email = user1.email;

      const createUserResponse2 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse2.statusCode).toBe(201);
      const { data: user2 }: CreateUserResponseDto = createUserResponse2.body;

      expect(user2.email).toBe(user1.email);
      expect(user2.phone).not.toBe(user1.phone);

      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + user1.id)
        .send({
          phone: user2.phone,
        })
        .set('Authorization', `Bearer ${adminAccessToken}`);
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

      let deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user1.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user2.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });

    test('when tries to set up someone else`s email and phone number (different letters size)', async () => {
      const requestData1 = generateValidUser();
      requestData1.email = requestData1.email.toLocaleLowerCase();
      const createUserResponse1 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData1)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse1.statusCode).toBe(201);
      const { data: user1 }: CreateUserResponseDto = createUserResponse1.body;

      const requestData2 = generateValidUser();
      requestData2.email = requestData2.email.toLocaleLowerCase();
      const createUserResponse2 = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData2)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse2.statusCode).toBe(201);
      const { data: user2 }: CreateUserResponseDto = createUserResponse2.body;

      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + user1.id)
        .send({
          email: user2.email.toLocaleUpperCase(),
          phone: user2.phone,
        })
        .set('Authorization', `Bearer ${adminAccessToken}`);
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

      let deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user1.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user2.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });

    test('when tries to update user that not exist', async () => {
      const createUserRequestData = {
        ...generateValidUser(),
        firstName: 'Bob',
      } satisfies CreateUserDto;
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(createUserRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const body: CreateUserResponseDto = createUserResponse.body as CreateUserResponseDto;
      expect(typeof body).toBe('object');
      const { data: newUser }: CreateUserResponseDto = body;
      expect(newUser?.id).toBeDefined();

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUser.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);

      const updateUserRequestData = {
        ...createUserRequestData,
      } satisfies UpdateUserDto;
      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + newUser.id)
        .send(updateUserRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateUserResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserUpdated).not.toHaveBeenCalled();
    });
  });

  describe('PUT should respond with a status code of 403', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is not set', async () => {
      const admin = getAdminLoginData();
      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + admin.uuid)
        .send(generateValidUser());
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
      const requestData = generateValidUser();
      const newUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;
      const admin = getAdminLoginData();

      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + admin.uuid)
        .send(generateValidUser())
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(updateUserResponse.statusCode).toBe(403);
      expect(updateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
      const requestData = generateValidUser();
      const newUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(newUserResponse.statusCode).toBe(201);
      let body: any = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const systemPermissions = Object.values(SystemPermission);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermission.EditUser) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, password: requestData.password } satisfies LoginDto))?.accessToken;
      const admin = getAdminLoginData();

      const updateUserResponse = await request(app.getServer())
        .put(userRoute.path + '/' + admin.uuid)
        .send(generateValidUser())
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(updateUserResponse.statusCode).toBe(403);
      expect(updateUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateUserResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
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
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is invalid', async () => {
      const requestData = getAdminLoginData();
      const response = await request(app.getServer())
        .put(userRoute.path + '/' + requestData.uuid)
        .send(requestData)
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
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
      const userBob = generateValidUser();

      const createBobResponse = await request(app.getServer()).post(userRoute.path).send(userBob).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createBobResponse.statusCode).toBe(201);
      const { data: bobDto, message: bobCreateMessage }: CreateUserResponseDto = createBobResponse.body;
      expect(bobDto?.id).toBeDefined();
      expect(bobCreateMessage).toBe(events.users.userCreated);

      const activateBobResponse = await request(app.getServer())
        .post(userRoute.path + '/' + bobDto.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateBobResponse.statusCode).toBe(200);

      const bobAccessToken = (await loginAs(app, { email: bobDto.email, password: userBob.password } satisfies LoginDto))?.accessToken;

      const deleteBobResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + bobDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteBobResponse.statusCode).toBe(200);

      const admin = getAdminLoginData();
      const updateUserUsingBobAccessTokenResponse = await request(app.getServer())
        .put(userRoute.path + '/' + admin.uuid)
        .send(generateValidUser())
        .set('Authorization', `Bearer ${bobAccessToken}`);
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
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
