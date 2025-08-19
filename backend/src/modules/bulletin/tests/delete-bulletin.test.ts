import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto } from '@modules/users';
import { generateValidUserWithPassword } from '@modules/users/tests/test.helpers';
import { getAdminLoginData } from '@utils';
import { Guid } from 'guid-typescript';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';
import { DeleteBulletinResponseDto } from '../dtos/delete-bulletin.dto';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('DELETE /bulletins/:id', () => {
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

  describe('DELETE should respond with a status code of 200 when data are valid and user has permission', () => {
    test('delete existing bulletin', async () => {
      const requestData = generateValidBulletin();

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;

      const deleteBulletinResponse = await app!.bulletin.delete(bulletinId, adminAccessToken);
      expect(deleteBulletinResponse.statusCode).toBe(200);
      expect(deleteBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteBulletinResponse.body;
      expect(typeof body).toBe('object');

      const { message }: DeleteBulletinResponseDto = body;
      expect(message).toBe(events.bulletin.bulletinDeleted);

      // Verify bulletin is actually deleted
      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      expect(getBulletinResponse.statusCode).toBe(400);
    });
  });

  describe('DELETE should respond with a status code of 400', () => {
    test('when bulletin does not exist', async () => {
      const bulletinId: string = Guid.EMPTY;
      const deleteResponse = await app!.bulletin.delete(bulletinId, adminAccessToken);
      expect(deleteResponse.statusCode).toBe(400);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: deleteMessage, args: deleteArgs } = data;
      expect(deleteMessage).toBe(errorKeys.bulletin.Bulletin_Does_Not_Exist);
      expect(deleteArgs).toEqual({ id: bulletinId });

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('DELETE should respond with a status code of 404', () => {
    test('when id is not valid guid', async () => {
      const deleteBulletinResponse = await app!.bulletin.delete('invalid-id', adminAccessToken);
      expect(deleteBulletinResponse.statusCode).toBe(404);
      expect(deleteBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteBulletinResponse.body;
      expect(typeof body).toBe('object');
    });
  });

  describe('DELETE should respond with a status code of 403', () => {
    test('when user has no permission', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);
      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;

      const deleteBulletinResponse = await app!.bulletin.delete(
        '12345678-1234-1234-1234-123456789012',
        userAccessToken,
      );
      expect(deleteBulletinResponse.statusCode).toBe(403);

      await app!.user.delete(createdUser.id, adminAccessToken);
    });

    test('when user have all permissions expect DeleteBulletin', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);

      const allPermissionsExceptDeleteBulletin = Object.values(SystemPermissions).filter(
        permission => permission !== SystemPermissions.DeleteBulletin,
      );

      for (const permission of allPermissionsExceptDeleteBulletin) {
        await app!.permissions.add(createdUser.id, permission, adminAccessToken);
      }

      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;

      const deleteBulletinResponse = await app!.bulletin.delete(
        '12345678-1234-1234-1234-123456789012',
        userAccessToken,
      );
      expect(deleteBulletinResponse.statusCode).toBe(403);

      await app!.user.delete(createdUser.id, adminAccessToken);
    });
  });

  describe('DELETE should respond with a status code of 401', () => {
    test('when token is not set', async () => {
      const deleteBulletinResponse = await app!.bulletin.delete('12345678-1234-1234-1234-123456789012');
      expect(deleteBulletinResponse.statusCode).toBe(401);
    });

    test('when token is invalid', async () => {
      const deleteBulletinResponse = await app!.bulletin.delete(
        '12345678-1234-1234-1234-123456789012',
        'invalid_token',
      );
      expect(deleteBulletinResponse.statusCode).toBe(401);
    });

    test('when try to use token from user that not exists', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);
      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;
      await app!.user.delete(createdUser.id, adminAccessToken);

      const deleteBulletinResponse = await app!.bulletin.delete(
        '12345678-1234-1234-1234-123456789012',
        userAccessToken,
      );
      expect(deleteBulletinResponse.statusCode).toBe(401);
      expect(deleteBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteBulletinResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as UnauthorizedException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Wrong_Authentication_Token);
      expect(loginArgs).toBeUndefined();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
