/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUser, loginAs } from '@helpers/user-tests.helpers';
import { AnnouncementsRout, AnnouncementStateValue, CreateAnnouncementsResponseDto } from '@modules/announcements';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import { CreateUserResponseDto, UserRoute } from '@modules/users';
import { isGuid, isNumber } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { isDateString } from 'class-validator';
import { EventDispatcher } from 'event-dispatch';
import request from 'supertest';
import { generateValidAnnouncements } from '../helpers/announcements-tests.helpers';

describe('POST /announcements', () => {
  const announcementRoute = new AnnouncementsRout();
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();

  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute, announcementRoute]);
    const { email: login, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email: login, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('POST should respond with a status code of 201 when data are valid and user has permission', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('create unpublished announcement', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcements).toBeDefined();
      expect(announcements!.id).toBeDefined();
      expect(isGuid(announcements!.id)).toBe(true);
      expect(announcements!.createdBy).toBeDefined();
      expect(announcements!.createdAt).toBeDefined();
      expect(isDateString(announcements!.createdAt)).toBe(true);
      expect(announcements!.updatedAt).toBeDefined();
      expect(isDateString(announcements!.updatedAt)).toBe(true);
      expect(announcements?.title).toBe(requestData.title);
      expect(announcements?.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcements?.publishedAt).toBeUndefined();
      expect(announcements?.publishedBy).toBeUndefined();
      expect(announcements!.validFromDate!).toBe(requestData.validFromDate!.toISOString());
      expect(announcements?.items).toBeDefined();
      expect(announcements?.items.length).toBe(requestData.items.length);
      expect(announcements!.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcements!.items.every(item => item.content !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.updatedBy === undefined)).toBe(true);
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onAnnouncementsCreated].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcements!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);
    });

    test('create unpublished announcement without title', async () => {
      const requestData = generateValidAnnouncements();
      requestData.title = undefined;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcements).toBeDefined();
      expect(announcements!.id).toBeDefined();
      expect(isGuid(announcements!.id)).toBe(true);
      expect(announcements!.createdBy).toBeDefined();
      expect(announcements!.createdAt).toBeDefined();
      expect(isDateString(announcements!.createdAt)).toBe(true);
      expect(announcements!.updatedAt).toBeDefined();
      expect(isDateString(announcements!.updatedAt)).toBe(true);
      expect(announcements?.title).toBeUndefined();
      expect(announcements?.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcements?.publishedAt).toBeUndefined();
      expect(announcements?.publishedBy).toBeUndefined();
      expect(announcements!.validFromDate!).toBe(requestData.validFromDate!.toISOString());
      expect(announcements?.items).toBeDefined();
      expect(announcements?.items.length).toBe(requestData.items.length);
      expect(announcements!.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcements!.items.every(item => item.content !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.updatedBy === undefined)).toBe(true);
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onAnnouncementsCreated].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcements!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);
    });

    test('create unpublished announcement without title and without validFromDate', async () => {
      const requestData = generateValidAnnouncements();
      requestData.title = undefined;
      requestData.validFromDate = undefined;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcements).toBeDefined();
      expect(announcements!.id).toBeDefined();
      expect(isGuid(announcements!.id)).toBe(true);
      expect(announcements!.createdBy).toBeDefined();
      expect(announcements!.createdAt).toBeDefined();
      expect(isDateString(announcements!.createdAt)).toBe(true);
      expect(announcements!.updatedAt).toBeDefined();
      expect(isDateString(announcements!.updatedAt)).toBe(true);
      expect(announcements?.title).toBeUndefined();
      expect(announcements?.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcements?.publishedAt).toBeUndefined();
      expect(announcements?.publishedBy).toBeUndefined();
      expect(announcements?.validFromDate).toBeUndefined();
      expect(announcements?.items).toBeDefined();
      expect(announcements?.items.length).toBe(requestData.items.length);
      expect(announcements!.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcements!.items.every(item => item.content !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcements!.items.every(item => item.updatedBy === undefined)).toBe(true);
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onAnnouncementsCreated].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcements!.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);
    });
  });

  // describe('POST should respond with a status code of 400', () => {
  //   beforeEach(async () => {
  //     jest.resetAllMocks();
  //   });

  //   test('when password is invalid', async () => {
  //     const requestData = { email: 'email@domain.com', phone: '123456789', password: 'paasssword' } satisfies CreateUserDto;
  //     const createUserResponse = await request(app.getServer())
  //       .post(userRouter.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createUserResponse.statusCode).toBe(400);
  //     const errors = (createUserResponse.body.data.message as string)?.split(',');
  //     expect(errors.filter(x => !x.includes('Password')).length).toBe(0);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   test('when email is invalid', async () => {
  //     const requestData = { password: 'strongPassword1@', phone: '123456789', email: 'invalid email' } satisfies CreateUserDto;
  //     const createUserResponse = await request(app.getServer())
  //       .post(userRouter.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createUserResponse.statusCode).toBe(400);
  //     const errors = (createUserResponse.body.data.message as string)?.split(',');
  //     expect(errors.filter(x => !x.includes('Email')).length).toBe(0);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   test('when phone is invalid', async () => {
  //     const requestData = { email: 'email@domain.com', password: 'strongPassword1@', phone: 'invalid phone' } satisfies CreateUserDto;
  //     const createUserResponse = await request(app.getServer())
  //       .post(userRouter.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createUserResponse.statusCode).toBe(400);
  //     const errors = (createUserResponse.body.data.message as string)?.split(',');
  //     expect(errors.filter(x => !x.includes('Phone')).length).toBe(0);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   test('when exist user with same email and phone', async () => {
  //     const requestData = generateValidUser();
  //     const createUserResponse1 = await request(app.getServer())
  //       .post(userRouter.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createUserResponse1.statusCode).toBe(201);
  //     const { data: user, message: createMessage }: CreateUserResponseDto = createUserResponse1.body;
  //     expect(createMessage).toBe(events.users.userCreated);

  //     const createUserResponse2 = await request(app.getServer())
  //       .post(userRouter.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createUserResponse2.statusCode).toBe(400);
  //     const body = createUserResponse2.body;
  //     expect(typeof body).toBe('object');
  //     expect(body.data.message).toBe(errorKeys.users.User_Already_Exists);

  //     const deleteUserResponse = await request(app.getServer())
  //       .delete(userRouter.path + '/' + user.id)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(deleteUserResponse.statusCode).toBe(200);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers)
  //       .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
  //       .forEach(([, eventHandler]) => {
  //         expect(eventHandler).not.toHaveBeenCalled();
  //       });
  //     expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
  //     expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
  //   });

  //   test('when exist user with same email and phone (different letters size)', async () => {
  //     const requestData = generateValidUser();
  //     const createUserResponse1 = await request(app.getServer())
  //       .post(userRouter.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createUserResponse1.statusCode).toBe(201);
  //     const { data: user, message: createMessage }: CreateUserResponseDto = createUserResponse1.body;
  //     expect(createMessage).toBe(events.users.userCreated);

  //     requestData.email = requestData.email.toUpperCase();
  //     const createUserResponse2 = await request(app.getServer())
  //       .post(userRouter.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createUserResponse2.statusCode).toBe(400);
  //     const body = createUserResponse2.body;
  //     expect(typeof body).toBe('object');
  //     expect(body.data.message).toBe(errorKeys.users.User_Already_Exists);

  //     const deleteUserResponse = await request(app.getServer())
  //       .delete(userRouter.path + '/' + user.id)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(deleteUserResponse.statusCode).toBe(200);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers)
  //       .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
  //       .forEach(([, eventHandler]) => {
  //         expect(eventHandler).not.toHaveBeenCalled();
  //       });
  //     expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
  //     expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
  //   });
  // });

  describe('POST should respond with a status code of 403', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is not set', async () => {
      const data = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer()).post(announcementRoute.path).send(data);
      expect(createAnnouncementsResponse.statusCode).toBe(401);
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const userData = generateValidUser();
      const newUserResponse = await request(app.getServer()).post(userRoute.path).send(userData).set('Authorization', `Bearer ${adminAccessToken}`);
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

      const newUserAccessToken = (await loginAs(app, { email: userData.email, password: userData.password } satisfies LoginDto))?.accessToken;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(403);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
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
    });

    test('when user have all permissions expect AddAnnouncements', async () => {
      const userData = generateValidUser();
      const newUserResponse = await request(app.getServer()).post(userRoute.path).send(userData).set('Authorization', `Bearer ${adminAccessToken}`);
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

      const systemPermissions = Object.values(SystemPermission);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermission.AddAnnouncements) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: userData.email, password: userData.password } satisfies LoginDto))?.accessToken;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(403);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      const deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
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
    });
  });

  describe('POST should respond with a status code of 401', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('when token is invalid', async () => {
      const requestData = generateValidAnnouncements();
      const response = await request(app.getServer())
        .post(announcementRoute.path)
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

      const createAnnouncementsUsingBobAccessTokenResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${bobAccessToken}`);
      expect(createAnnouncementsUsingBobAccessTokenResponse.statusCode).toBe(401);
      expect(createAnnouncementsUsingBobAccessTokenResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsUsingBobAccessTokenResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
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
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
