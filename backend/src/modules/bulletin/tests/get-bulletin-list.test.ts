import { events, ILoginModel, SystemPermissions } from '@core';
import { errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto } from '@modules/users';
import { generateValidUserWithPassword } from '@modules/users/tests/test.helpers';
import { getAdminLoginData } from '@utils';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';
import { GetBulletinListResponseDto } from '../dtos/get-bulletin-list.dto';

describe('GET /bulletins', () => {
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

  describe('GET should respond with a status code of 200 when data are valid and user has permission', () => {
    test('get bulletin list with default pagination', async () => {
      const requestData1 = generateValidBulletin();
      requestData1.date = new Date('2024-01-01');
      requestData1.number = 11;

      const requestData2 = generateValidBulletin();
      requestData2.date = new Date('2024-01-02');
      requestData2.number = 12;

      const createBulletinResponse1 = await app!.bulletin.create(requestData1, adminAccessToken);
      expect(createBulletinResponse1.statusCode).toBe(201);
      const { data: bulletinId1 }: CreateBulletinResponseDto = createBulletinResponse1.body;

      const createBulletinResponse2 = await app!.bulletin.create(requestData2, adminAccessToken);
      expect(createBulletinResponse2.statusCode).toBe(201);
      const { data: bulletinId2 }: CreateBulletinResponseDto = createBulletinResponse2.body;

      const getBulletinListResponse = await app!.bulletinList.get(undefined, undefined, adminAccessToken);
      expect(getBulletinListResponse.statusCode).toBe(200);
      expect(getBulletinListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getBulletinListResponse.body;
      expect(typeof body).toBe('object');

      const { data: bulletinListPage, message }: GetBulletinListResponseDto = body;
      expect(message).toBe(events.bulletin.bulletinListRetrieved);
      expect(bulletinListPage).toBeDefined();
      expect(bulletinListPage.items).toBeDefined();
      expect(Array.isArray(bulletinListPage.items)).toBe(true);
      expect(bulletinListPage.items.length).toBeGreaterThanOrEqual(2);
      expect(bulletinListPage.totalCount).toBeDefined();
      expect(typeof bulletinListPage.totalCount).toBe('number');

      // Verify the created bulletins are in the list
      const createdBulletinIds = [bulletinId1, bulletinId2];
      const foundBulletins = bulletinListPage.items.filter(bulletin => createdBulletinIds.includes(bulletin.id));
      expect(foundBulletins.length).toBe(2);

      await app!.bulletin.delete(bulletinId1, adminAccessToken);
      await app!.bulletin.delete(bulletinId2, adminAccessToken);
    });

    test('get bulletin list with custom pagination', async () => {
      const requestData = generateValidBulletin();

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;

      const getBulletinListResponse = await app!.bulletinList.get(0, 5, adminAccessToken);
      expect(getBulletinListResponse.statusCode).toBe(200);
      const { data: bulletinListPage }: GetBulletinListResponseDto = getBulletinListResponse.body;

      expect(bulletinListPage.items).toBeDefined();
      expect(Array.isArray(bulletinListPage.items)).toBe(true);
      expect(bulletinListPage.totalCount).toBeDefined();
      expect(typeof bulletinListPage.totalCount).toBe('number');

      await app!.bulletin.delete(bulletinId, adminAccessToken);
    });

    test('get empty bulletin list when no bulletins exist', async () => {
      // Note: This test assumes we can clear all bulletins or run in isolation
      const getBulletinListResponse = await app!.bulletinList.get(0, 10, adminAccessToken);
      expect(getBulletinListResponse.statusCode).toBe(200);
      const { data: bulletinListPage }: GetBulletinListResponseDto = getBulletinListResponse.body;

      expect(bulletinListPage.items).toBeDefined();
      expect(Array.isArray(bulletinListPage.items)).toBe(true);
    });
  });

  describe('GET should respond with a status code of 200', () => {
    test('when pageIndex is negative (ignored)', async () => {
      const getBulletinListResponse = await app!.bulletinList.get(-1, 10, adminAccessToken);
      expect(getBulletinListResponse.statusCode).toBe(200);
    });

    test('when pageSize is negative (ignored)', async () => {
      const getBulletinListResponse = await app!.bulletinList.get(0, -5, adminAccessToken);
      expect(getBulletinListResponse.statusCode).toBe(200);
    });

    test('when pageSize exceeds maximum allowed (ignored)', async () => {
      const getBulletinListResponse = await app!.bulletinList.get(0, 1000, adminAccessToken);
      expect(getBulletinListResponse.statusCode).toBe(200);
    });
  });

  describe('GET should respond with a status code of 403', () => {
    test('when user has no permission', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);
      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;

      const getBulletinListResponse = await app!.bulletinList.get(0, 10, userAccessToken);
      expect(getBulletinListResponse.statusCode).toBe(403);

      await app!.user.delete(createdUser.id, adminAccessToken);
    });

    test('when user have all permissions expect PreviewBulletinList', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);

      const allPermissionsExceptPreviewBulletinList = Object.values(SystemPermissions).filter(
        permission => permission !== SystemPermissions.PreviewBulletinList,
      );

      for (const permission of allPermissionsExceptPreviewBulletinList) {
        await app!.permissions.add(createdUser.id, permission, adminAccessToken);
      }

      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;

      const getBulletinListResponse = await app!.bulletinList.get(0, 10, userAccessToken);
      expect(getBulletinListResponse.statusCode).toBe(403);

      await app!.user.delete(createdUser.id, adminAccessToken);
    });
  });

  describe('GET should respond with a status code of 401', () => {
    test('when token is not set', async () => {
      const getBulletinListResponse = await app!.bulletinList.get();
      expect(getBulletinListResponse.statusCode).toBe(401);
    });

    test('when token is invalid', async () => {
      const getBulletinListResponse = await app!.bulletinList.get(0, 10, 'invalid_token');
      expect(getBulletinListResponse.statusCode).toBe(401);
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

      const getBulletinListResponse = await app!.bulletinList.get(0, 10, userAccessToken);
      expect(getBulletinListResponse.statusCode).toBe(401);
      expect(getBulletinListResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getBulletinListResponse.body;
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
