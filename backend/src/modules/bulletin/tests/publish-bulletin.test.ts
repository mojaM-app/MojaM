import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto } from '@modules/users';
import { generateValidUserWithPassword } from '@modules/users/tests/test.helpers';
import { getAdminLoginData } from '@utils';
import { isDateString } from 'class-validator';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';
import { GetBulletinResponseDto } from '../dtos/get-bulletin.dto';
import { PublishBulletinResponseDto } from '../dtos/publish-bulletin.dto';
import { BulletinState } from '../enums/bulletin-state.enum';

describe('POST /bulletins/:id/publish', () => {
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

  describe('POST should respond with a status code of 200 when data are valid and user has permission', () => {
    test('publish draft bulletin', async () => {
      const requestData = generateValidBulletin();

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;

      // Verify bulletin is in draft state
      const getBulletinBeforeResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      expect(getBulletinBeforeResponse.statusCode).toBe(200);
      const { data: bulletinBefore }: GetBulletinResponseDto = getBulletinBeforeResponse.body;
      expect(bulletinBefore.state).toBe(BulletinState.Draft);
      expect(bulletinBefore.publishedAt).toBeNull();
      expect(bulletinBefore.publishedBy).toBeNull();

      const publishBulletinResponse = await app!.bulletin.publish(bulletinId, adminAccessToken);
      expect(publishBulletinResponse.statusCode).toBe(200);
      expect(publishBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = publishBulletinResponse.body;
      expect(typeof body).toBe('object');

      const { message }: PublishBulletinResponseDto = body;
      expect(message).toBe(events.bulletin.bulletinPublished);

      // Verify bulletin is now published
      const getBulletinAfterResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      expect(getBulletinAfterResponse.statusCode).toBe(200);
      const { data: bulletinAfter }: GetBulletinResponseDto = getBulletinAfterResponse.body;
      expect(bulletinAfter.state).toBe(BulletinState.Published);
      expect(bulletinAfter.publishedAt).toBeDefined();
      expect(isDateString(bulletinAfter.publishedAt!)).toBe(true);
      expect(bulletinAfter.publishedBy).toBeDefined();
      expect(bulletinAfter.publishedBy!.length).toBeGreaterThan(0);

      await app!.bulletin.delete(bulletinId, adminAccessToken);
    });

    test('republish already published bulletin should succeed', async () => {
      const requestData = generateValidBulletin();

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;

      // Publish first time
      const publishBulletinResponse1 = await app!.bulletin.publish(bulletinId, adminAccessToken);
      expect(publishBulletinResponse1.statusCode).toBe(200);

      // Publish second time
      const publishBulletinResponse2 = await app!.bulletin.publish(bulletinId, adminAccessToken);
      expect(publishBulletinResponse2.statusCode).toBe(200);
      const { message }: PublishBulletinResponseDto = publishBulletinResponse2.body;
      expect(message).toBe(events.bulletin.bulletinPublished);

      await app!.bulletin.delete(bulletinId, adminAccessToken);
    });
  });

  describe('POST should respond with a status code of 400', () => {
    test('when bulletin does not exist', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const publishBulletinResponse = await app!.bulletin.publish(nonExistentId, adminAccessToken);
      expect(publishBulletinResponse.statusCode).toBe(400);
      expect(publishBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = publishBulletinResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message } = data;
      expect(message).toBe(errorKeys.bulletin.Bulletin_Does_Not_Exist);
    });

    test('when bulletin has no days', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [];

      const createRes = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createRes.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createRes.body;

      const publishRes = await app!.bulletin.publish(bulletinId, adminAccessToken);
      expect(publishRes.statusCode).toBe(400);
      const data = publishRes.body.data as BadRequestException;
      expect(data.message).toBe(errorKeys.bulletin.Bulletin_Must_Have_At_Least_One_Day);

      await app!.bulletin.delete(bulletinId, adminAccessToken);
    });

    test('when a day has no sections', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [{ ...requestData.days![0], sections: [] }];

      const createRes = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createRes.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createRes.body;

      const publishRes = await app!.bulletin.publish(bulletinId, adminAccessToken);
      expect(publishRes.statusCode).toBe(400);
      const data = publishRes.body.data as BadRequestException;
      expect(data.message).toBe(errorKeys.bulletin.Day_Must_Have_At_Least_One_Section);

      await app!.bulletin.delete(bulletinId, adminAccessToken);
    });

    test('when a day has no title', async () => {
      const createData = generateValidBulletin();
      // Ensure at least one day exists but without title
      createData.days![0].title = undefined as any;

      const createRes = await app!.bulletin.create(createData, adminAccessToken);
      expect(createRes.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createRes.body;

      const publishRes = await app!.bulletin.publish(bulletinId, adminAccessToken);
      expect(publishRes.statusCode).toBe(400);
      const message = (publishRes.body.data?.message ?? publishRes.body.message) as string | string[] | undefined;
      if (Array.isArray(message)) {
        expect(message).toContain(errorKeys.bulletin.Day_Title_Is_Required);
      } else {
        expect(String(message)).toEqual(expect.stringContaining(errorKeys.bulletin.Day_Title_Is_Required));
      }

      await app!.bulletin.delete(bulletinId, adminAccessToken);
    });

    test('when bulletin Id looks like a valid guid but it is not', async () => {
      const nonExistentId = '99999999-9999-9999-9999-999999999999';
      const publishRes = await app!.bulletin.publish(nonExistentId, adminAccessToken);
      expect(publishRes.statusCode).toBe(400);
      const data = publishRes.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.bulletin.Bulletin_Does_Not_Exist).length).toBe(0);
    });
  });

  describe('POST should respond with a status code of 404', () => {
    test('when id is not valid guid', async () => {
      const publishBulletinResponse = await app!.bulletin.publish('invalid-id', adminAccessToken);
      expect(publishBulletinResponse.statusCode).toBe(404);
      expect(publishBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = publishBulletinResponse.body;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(errorKeys.general.Resource_Does_Not_Exist);
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is not set', async () => {
      const publishBulletinResponse = await app!.bulletin.publish('12345678-1234-1234-1234-123456789012');
      expect(publishBulletinResponse.statusCode).toBe(401);
    });

    test('when token is invalid', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);
      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;

      const publishBulletinResponse = await app!.bulletin.publish(
        '12345678-1234-1234-1234-123456789012',
        userAccessToken,
      );
      expect(publishBulletinResponse.statusCode).toBe(403);

      await app!.user.delete(createdUser.id, adminAccessToken);
    });

    test('when user have all permissions expect PublishBulletin', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);

      const allPermissionsExceptPublishBulletin = Object.values(SystemPermissions).filter(
        permission => permission !== SystemPermissions.PublishBulletin,
      );

      for (const permission of allPermissionsExceptPublishBulletin) {
        await app!.permissions.add(createdUser.id, permission, adminAccessToken);
      }

      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;

      const publishBulletinResponse = await app!.bulletin.publish(
        '12345678-1234-1234-1234-123456789012',
        userAccessToken,
      );
      expect(publishBulletinResponse.statusCode).toBe(403);

      await app!.user.delete(createdUser.id, adminAccessToken);
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const publishBulletinResponse = await app!.bulletin.publish(
        '12345678-1234-1234-1234-123456789012',
        'invalid_token',
      );
      expect(publishBulletinResponse.statusCode).toBe(401);
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

      const publishBulletinResponse = await app!.bulletin.publish(
        '12345678-1234-1234-1234-123456789012',
        userAccessToken,
      );
      expect(publishBulletinResponse.statusCode).toBe(401);
      expect(publishBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = publishBulletinResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      expect(data.message).toBe(errorKeys.login.Wrong_Authentication_Token);
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
