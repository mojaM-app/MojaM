/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { relatedDataNames } from '@db';
import { EventDispatcherService, events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { generateValidUserWithPassword, loginAs } from '@helpers/user-tests.helpers';
import { AnnouncementsRout, CreateAnnouncementsResponseDto, GetAnnouncementsResponseDto, UpdateAnnouncementsDto } from '@modules/announcements';
import { generateValidAnnouncements } from '@modules/announcements/tests/announcements-tests.helpers';
import { AccountTryingToLogInDto, AuthRoute, LoginDto } from '@modules/auth';
import { AddPermissionsResponseDto, PermissionsRoute, SystemPermissions } from '@modules/permissions';
import { CreateUserResponseDto, DeleteUserResponseDto, UserRoute } from '@modules/users';
import { isNumber } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { App } from './../../../app';

describe('DELETE /user', () => {
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const authRoute = new AuthRoute();
  const announcementRoute = new AnnouncementsRout();
  const app = new App();
  let adminAccessToken: string | undefined;
  let mockSendMail: any;

  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute, authRoute, announcementRoute]);
    const { email, passcode } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, passcode } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    mockSendMail = jest.fn().mockImplementation((mailOptions: any, callback: (error: any, info: any) => void) => {
      callback(null, null);
    });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
      close: jest.fn().mockImplementation(() => {}),
    } as any);
  });

  describe('DELETE should respond with a status code of 200', () => {
    test('when data are valid and logged user has permission', async () => {
      const user = generateValidUserWithPassword();
      const createUserResponse = await request(app.getServer()).post(userRoute.path).send(user).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: CreateUserResponseDto = createUserResponse.body;
      expect(newUserDto?.id).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + newUserDto.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserResult, message: deleteMessage }: DeleteUserResponseDto = body;
      expect(deleteMessage).toBe(events.users.userDeleted);
      expect(deletedUserResult).toBe(true);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalledTimes(1);
    });

    test('when a user have ony of system permissions granted by another user', async () => {
      const requestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
      expect(addPermissionResult).toBe(true);
      expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

      const deleteUserWithSystemPermissionResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserWithSystemPermissionResponse.statusCode).toBe(200);
      expect(deleteUserWithSystemPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserWithSystemPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserResult, message: deleteMessage }: DeleteUserResponseDto = body;
      expect(deleteMessage).toBe(events.users.userDeleted);
      expect(deletedUserResult).toBe(true);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onUserCreated, testEventHandlers.onUserDeleted, testEventHandlers.onPermissionAdded].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });

    test('when a user have ony of system permissions granted by himself', async () => {
      const requestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateNewUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.AddPermission.toString();
      let addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
      expect(addPermission1Result).toBe(true);
      expect(addPermission1Message).toBe(events.permissions.permissionAdded);

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PreviewUserList.toString();
      addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(addPermissionResponse.statusCode).toBe(201);
      expect(addPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
      expect(addPermission2Result).toBe(true);
      expect(addPermission2Message).toBe(events.permissions.permissionAdded);

      const deleteUserWithSystemPermissionResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserWithSystemPermissionResponse.statusCode).toBe(200);
      expect(deleteUserWithSystemPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserWithSystemPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserResult, message: deleteMessage }: DeleteUserResponseDto = body;
      expect(deleteMessage).toBe(events.users.userDeleted);
      expect(deletedUserResult).toBe(true);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionAdded,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });

    test('when a user has reset passcode token', async () => {
      const requestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const requestResetPasscodeResponse = await request(app.getServer())
        .post(authRoute.requestResetPasscodePath)
        .send({ email: requestData.email } satisfies AccountTryingToLogInDto);
      expect(requestResetPasscodeResponse.statusCode).toBe(200);
      body = requestResetPasscodeResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);

      const deleteUserWithResetPasscodeTokenResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserWithResetPasscodeTokenResponse.statusCode).toBe(200);
      expect(deleteUserWithResetPasscodeTokenResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserWithResetPasscodeTokenResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserResult, message: deleteMessage }: DeleteUserResponseDto = body;
      expect(deleteMessage).toBe(events.users.userDeleted);
      expect(deletedUserResult).toBe(true);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              // testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              // testEventHandlers.onPermissionAdded,
              // testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      // expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      // expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('DELETE should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const userId: string = Guid.EMPTY;
      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + userId)
        .send();
      expect(deleteResponse.statusCode).toBe(401);
      const body = deleteResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const requestData = generateValidUserWithPassword();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
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

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(deleteResponse.statusCode).toBe(403);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserResult, message: deleteMessage }: DeleteUserResponseDto = body;
      expect(deleteMessage).toBe(events.users.userDeleted);
      expect(deletedUserResult).toBe(true);

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

    test('when user have all permissions expect DeleteUser', async () => {
      const requestData = generateValidUserWithPassword();
      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
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

      const systemPermissions = Object.values(SystemPermissions);
      systemPermissions.forEach(async permission => {
        if (isNumber(permission)) {
          const value = permission as number;
          if (value !== SystemPermissions.DeleteUser) {
            const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
            const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
            expect(addPermissionResponse.statusCode).toBe(201);
          }
        }
      });

      const newUserAccessToken = (await loginAs(app, { email: requestData.email, passcode: requestData.passcode } satisfies LoginDto))?.accessToken;

      let deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${newUserAccessToken}`);
      expect(deleteResponse.statusCode).toBe(403);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserResult, message: deleteMessage }: DeleteUserResponseDto = body;
      expect(deleteMessage).toBe(events.users.userDeleted);
      expect(deletedUserResult).toBe(true);

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

  describe('DELETE should respond with a status code of 400', () => {
    test('when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + userId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(400);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: deleteMessage, args: deleteArgs } = data;
      expect(deleteMessage).toBe(errorKeys.users.User_Does_Not_Exist);
      expect(deleteArgs).toEqual({ id: userId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('DELETE should respond with a status code of 409', () => {
    test('when a user has granted ony of system permissions to another users', async () => {
      const user1RequestData = generateValidUserWithPassword();

      let createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(user1RequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user1 }: CreateUserResponseDto = body;
      expect(user1?.id).toBeDefined();

      let activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user1.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      let path = permissionsRoute.path + '/' + user1.id + '/' + SystemPermissions.AddPermission.toString();
      const user1AddPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(user1AddPermissionResponse.statusCode).toBe(201);
      expect(user1AddPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = user1AddPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission1Result, message: addPermission1Message }: AddPermissionsResponseDto = body;
      expect(addPermission1Result).toBe(true);
      expect(addPermission1Message).toBe(events.permissions.permissionAdded);

      const user2RequestData = generateValidUserWithPassword();

      createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(user2RequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      body = createUserResponse.body;
      const { data: user2 }: CreateUserResponseDto = body;
      expect(user2?.id).toBeDefined();

      activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user2.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const user1AccessToken = (await loginAs(app, { email: user1RequestData.email, passcode: user1RequestData.passcode } satisfies LoginDto))
        ?.accessToken;

      path = permissionsRoute.path + '/' + user2.id + '/' + SystemPermissions.PreviewUserList.toString();
      const user2AddPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${user1AccessToken}`);
      expect(user2AddPermissionResponse.statusCode).toBe(201);
      expect(user2AddPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = user2AddPermissionResponse.body;
      expect(typeof body).toBe('object');
      const { data: addPermission2Result, message: addPermission2Message }: AddPermissionsResponseDto = body;
      expect(addPermission2Result).toBe(true);
      expect(addPermission2Message).toBe(events.permissions.permissionAdded);

      let deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user1.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(409);
      expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: deleteUserMessage, args: deleteUserArgs } = data;
      expect(deleteUserMessage).toBe(errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted);
      expect(deleteUserArgs).toEqual({ id: user1.id, relatedData: [relatedDataNames.SystemPermission_AssignedBy] });

      path = permissionsRoute.path + '/' + user1.id;
      let deleteAllPermissionsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAllPermissionsResponse.statusCode).toBe(200);

      path = permissionsRoute.path + '/' + user2.id;
      deleteAllPermissionsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAllPermissionsResponse.statusCode).toBe(200);

      path = userRoute.path + '/' + user1.id;
      deleteUserResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      path = userRoute.path + '/' + user2.id;
      deleteUserResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionAdded,
              testEventHandlers.onPermissionDeleted,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
    });

    test('when a user has created announcements', async () => {
      const userRequestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(userRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.AddAnnouncements.toString();
      const addUserPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addUserPermissionResponse.statusCode).toBe(201);
      expect(addUserPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addUserPermissionResponse.body;
      const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
      expect(addPermissionResult).toBe(true);
      expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

      const userAccessToken = (await loginAs(app, { email: userRequestData.email, passcode: userRequestData.passcode } satisfies LoginDto))
        ?.accessToken;

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${userAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      let deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(409);
      expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserResponse.body;
      const data = body.data as BadRequestException;
      const { message: deleteUserMessage, args: deleteUserArgs } = data;
      expect(deleteUserMessage).toBe(errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted);
      expect(deleteUserArgs).toEqual({
        id: user.id,
        relatedData: [relatedDataNames.Announcements_CreatedBy, relatedDataNames.AnnouncementItems_CreatedBy],
      });

      path = announcementRoute.path + '/' + announcementsId;
      const deleteAnnouncementsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      path = userRoute.path + '/' + user.id;
      deleteUserResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionAdded,
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsDeleted,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
    });

    test('when a user has published announcements', async () => {
      const userRequestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(userRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.PublishAnnouncements.toString();
      const addUserPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addUserPermissionResponse.statusCode).toBe(201);
      expect(addUserPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addUserPermissionResponse.body;
      const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
      expect(addPermissionResult).toBe(true);
      expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

      const userAccessToken = (await loginAs(app, { email: userRequestData.email, passcode: userRequestData.passcode } satisfies LoginDto))
        ?.accessToken;

      const publishAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path + '/' + announcementsId + '/' + announcementRoute.publishPath)
        .send()
        .set('Authorization', `Bearer ${userAccessToken}`);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);

      let deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(409);
      expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: deleteUserMessage, args: deleteUserArgs } = data;
      expect(deleteUserMessage).toBe(errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted);
      expect(deleteUserArgs).toEqual({ id: user.id, relatedData: [relatedDataNames.Announcements_PublishedBy] });

      path = announcementRoute.path + '/' + announcementsId;
      const deleteAnnouncementsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      path = userRoute.path + '/' + user.id;
      deleteUserResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionAdded,
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsPublished,
              testEventHandlers.onAnnouncementsDeleted,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
    });

    test('when a user has created announcements items', async () => {
      const userRequestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(userRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;

      let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.EditAnnouncements.toString();
      const addUserPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addUserPermissionResponse.statusCode).toBe(201);
      expect(addUserPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addUserPermissionResponse.body;
      const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
      expect(addPermissionResult).toBe(true);
      expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

      const userAccessToken = (await loginAs(app, { email: userRequestData.email, passcode: userRequestData.passcode } satisfies LoginDto))
        ?.accessToken;

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        setDefaultValues: () => {},
        items: announcementsBeforeUpdate.items.map(item => ({
          id: item.id,
          content: item.content,
          setDefaultValues: () => {},
        })),
      };
      updateAnnouncementsModel.items?.push({ id: '', content: 'new item', setDefaultValues: () => {} });
      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${userAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);

      let deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(409);
      expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: deleteUserMessage, args: deleteUserArgs } = data;
      expect(deleteUserMessage).toBe(errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted);
      expect(deleteUserArgs).toEqual({ id: user.id, relatedData: [relatedDataNames.AnnouncementItems_CreatedBy] });

      path = announcementRoute.path + '/' + announcementsId;
      const deleteAnnouncementsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      path = userRoute.path + '/' + user.id;
      deleteUserResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionAdded,
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsDeleted,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
    });

    test('when a user has updated announcements items', async () => {
      const userRequestData = generateValidUserWithPassword();

      const createUserResponse = await request(app.getServer())
        .post(userRoute.path)
        .send(userRequestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUserResponse.statusCode).toBe(201);
      let body = createUserResponse.body;
      const { data: user }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();

      const activateUserResponse = await request(app.getServer())
        .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateUserResponse.statusCode).toBe(200);

      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(generateValidAnnouncements())
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;

      let path = permissionsRoute.path + '/' + user.id + '/' + SystemPermissions.EditAnnouncements.toString();
      const addUserPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(addUserPermissionResponse.statusCode).toBe(201);
      expect(addUserPermissionResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = addUserPermissionResponse.body;
      const { data: addPermissionResult, message: addPermissionMessage }: AddPermissionsResponseDto = body;
      expect(addPermissionResult).toBe(true);
      expect(addPermissionMessage).toBe(events.permissions.permissionAdded);

      const userAccessToken = (await loginAs(app, { email: userRequestData.email, passcode: userRequestData.passcode } satisfies LoginDto))
        ?.accessToken;

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        setDefaultValues: () => {},
        items: announcementsBeforeUpdate.items.map((item, index) => ({
          id: item.id,
          content: `${index + 1}_New_Content_${item.id}`,
          setDefaultValues: () => {},
        })),
      };
      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${userAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);

      let deleteUserResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + user.id)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(409);
      expect(deleteUserResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = deleteUserResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: deleteUserMessage, args: deleteUserArgs } = data;
      expect(deleteUserMessage).toBe(errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted);
      expect(deleteUserArgs).toEqual({ id: user.id, relatedData: [relatedDataNames.AnnouncementItems_UpdatedBy] });

      path = announcementRoute.path + '/' + announcementsId;
      const deleteAnnouncementsResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      path = userRoute.path + '/' + user.id;
      deleteUserResponse = await request(app.getServer()).delete(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionAdded,
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsDeleted,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onUserLoggedIn,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalled();
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
    });
  });

  describe('DELETE should respond with a status code of 404', () => {
    test('DELETE should respond with a status code of 404 when user Id is not GUID', async () => {
      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/invalid-guid')
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(404);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const { message: deleteMessage }: { message: string } = body;
      expect(deleteMessage).toBe(errorKeys.general.Resource_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('DELETE should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const userId: string = Guid.EMPTY;
      const deleteResponse = await request(app.getServer())
        .delete(userRoute.path + '/' + userId)
        .send()
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(401);
      const body = deleteResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
