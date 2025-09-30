import { events, ILoginModel } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto } from '@modules/users';
import { generateValidUserWithPassword } from '@modules/users/tests/test.helpers';
import { getAdminLoginData, isGuid } from '@utils';
import { isDateString } from 'class-validator';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';
import { GetBulletinResponseDto } from '../dtos/get-bulletin.dto';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('GET /bulletins/:id', () => {
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
    test('get existing bulletin', async () => {
      const requestData = generateValidBulletin();

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;

      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      expect(getBulletinResponse.statusCode).toBe(200);
      expect(getBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getBulletinResponse.body;
      expect(typeof body).toBe('object');

      const { data: bulletin, message }: GetBulletinResponseDto = body;
      expect(message).toBe(events.bulletin.bulletinRetrieved);
      expect(bulletin).toBeDefined();
      expect(bulletin.id).toBe(bulletinId);
      expect(isGuid(bulletin.id)).toBe(true);
      expect(bulletin.title).toBe(requestData.title);
      expect(bulletin.number).toBe(requestData.number);
      expect(bulletin.introduction).toBe(requestData.introduction);
      expect(bulletin.tipsForWork).toBe(requestData.tipsForWork);
      expect(bulletin.dailyPrayer).toBe(requestData.dailyPrayer);
      expect(bulletin.createdBy?.length).toBeGreaterThan(0);
      expect(bulletin.createdAt).toBeDefined();
      expect(isDateString(bulletin.createdAt)).toBe(true);
      expect(bulletin.updatedAt).toBeDefined();
      expect(isDateString(bulletin.updatedAt)).toBe(true);
      expect(bulletin!.date).toBe(requestData.date!.toISOString());

      expect(bulletin.days).toBeDefined();
      expect(Array.isArray(bulletin.days)).toBe(true);
      expect(bulletin.days.length).toBe(requestData.days?.length || 0);

      bulletin.days.forEach((day, dayIndex) => {
        const requestDay = requestData.days![dayIndex];
        expect(day.id).toBeDefined();
        expect(isGuid(day.id)).toBe(true);
        expect(day.title).toBe(requestDay.title);
        expect(new Date(day.date!).toDateString()).toEqual(new Date(requestDay.date).toDateString());

        expect(day.sections).toBeDefined();
        expect(Array.isArray(day.sections)).toBe(true);
        expect(day.sections.length).toBe(requestDay.sections.length);

        day.sections.forEach((section, sectionIndex) => {
          const requestSection = requestDay.sections[sectionIndex];
          expect(section.id).toBeDefined();
          expect(isGuid(section.id)).toBe(true);
          expect(section.order).toBe(requestSection.order);
          expect(section.type).toBe(requestSection.type);
          expect(section.title).toBe(requestSection.title);
          expect(section.content).toBe(requestSection.content);
        });
      });

      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onBulletinCreated,
              testEventHandlers.onBulletinRetrieved,
              testEventHandlers.onBulletinDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should respond with a status code of 400', () => {
    test('when bulletin does not exist', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const getBulletinResponse = await app!.bulletin.get(nonExistentId, adminAccessToken);
      expect(getBulletinResponse.statusCode).toBe(400);
      expect(getBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getBulletinResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message } = data;
      expect(message).toBe(errorKeys.bulletin.Bulletin_Does_Not_Exist);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should respond with a status code of 404', () => {
    test('when id is not valid guid', async () => {
      const getBulletinResponse = await app!.bulletin.get('invalid-id', adminAccessToken);
      expect(getBulletinResponse.statusCode).toBe(404);
      expect(getBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getBulletinResponse.body;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(errorKeys.general.Resource_Does_Not_Exist);
    });
  });

  describe('GET should respond with a status code of 401', () => {
    test('when token is not set', async () => {
      const getBulletinResponse = await app!.bulletin.get('12345678-1234-1234-1234-123456789012');
      expect(getBulletinResponse.statusCode).toBe(401);
    });

    test('when token is invalid', async () => {
      const getBulletinResponse = await app!.bulletin.get('12345678-1234-1234-1234-123456789012', 'invalid_token');
      expect(getBulletinResponse.statusCode).toBe(401);
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

      const getBulletinResponse = await app!.bulletin.get('12345678-1234-1234-1234-123456789012', userAccessToken);
      expect(getBulletinResponse.statusCode).toBe(401);
      expect(getBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = getBulletinResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      expect(data.message).toBe(errorKeys.login.Wrong_Authentication_Token);
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

      const getBulletinResponse = await app!.bulletin.get('12345678-1234-1234-1234-123456789012', userAccessToken);
      expect(getBulletinResponse.statusCode).toBe(403);

      await app!.user.delete(createdUser.id, adminAccessToken);
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
