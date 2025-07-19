import { ILoginModel } from '@core';
import { errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { generateRandomString, getAdminLoginData, isNumber } from '@utils';
import { isDateString } from 'class-validator';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';

describe('POST /bulletin', () => {
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

  describe('POST should respond with a status code of 201 when data are valid and user has permission', () => {
    test('create bulletin successfully', async () => {
      const requestData = generateValidBulletin(365); // Start in 1 year to avoid conflict
      console.info('Request data startDate:', requestData.startDate);

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      console.info('Response:', JSON.stringify({
        statusCode: createBulletinResponse.statusCode,
        body: createBulletinResponse.body
      }, null, 2));
      
      if (createBulletinResponse.statusCode !== 201) {
        console.error('Failed response:', JSON.stringify({
          statusCode: createBulletinResponse.statusCode,
          body: createBulletinResponse.body
        }, null, 2));
      }
      
      expect(createBulletinResponse.statusCode).toBe(201);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));

      const body = createBulletinResponse.body;
      expect(typeof body).toBe('object');
      expect(body.id).toBeDefined();
      expect(isNumber(body.id)).toBe(true);
      expect(body.title).toBe(requestData.title);
      expect(new Date(body.startDate).toDateString()).toEqual(new Date(requestData.startDate).toDateString());
      expect(body.daysCount).toBe(requestData.daysCount);
      expect(body.state).toBe(1); // Draft state
      expect(body.createdAt).toBeDefined();
      expect(isDateString(body.createdAt)).toBe(true);

      // Log the entire body to see what we actually get
      console.info('Full body structure:', JSON.stringify(body, null, 2));

      // Cleanup
      const deleteBulletinResponse = await app!.bulletin.delete(body.id, adminAccessToken);
      expect(deleteBulletinResponse.statusCode).toBe(200);
    });

    test('create bulletin with minimum required fields', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 400); // Start in 400 days to avoid conflict
      
      const requestData = {
        title: `Minimal Bulletin ${generateRandomString(8)}`,
        startDate: startDate.toISOString().split('T')[0],
        daysCount: 1,
        days: [
          {
            dayNumber: 1,
            instructions: 'Basic instructions',
            tasks: [
              {
                taskOrder: 1,
                description: 'Basic task',
              },
            ],
          },
        ],
      };

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      expect(createBulletinResponse.body.title).toBe(requestData.title);

      // Cleanup
      await app!.bulletin.delete(createBulletinResponse.body.id, adminAccessToken);
    });
  });

  describe('POST should respond with a status code of 400 when data are invalid', () => {
    test('when title is missing', async () => {
      const requestData = generateValidBulletin(410); // Start far in future to avoid conflict
      delete (requestData as any).title;

      const response = await app!.bulletin.create(requestData, adminAccessToken);

      expect(response.statusCode).toBe(400);
      expect(response.body.data.message).toContain('title should not be empty');
    });

    test('when startDate is invalid', async () => {
      const requestData = generateValidBulletin(420); // Start far in future to avoid conflict
      requestData.startDate = 'invalid-date';

      const response = await app!.bulletin.create(requestData, adminAccessToken);

      expect(response.statusCode).toBe(400);
      expect(response.body.data.message).toContain('startDate must be a valid ISO 8601 date string');
    });

    test('when days array is empty', async () => {
      const requestData = generateValidBulletin(430); // Start far in future to avoid conflict
      requestData.days = [];

      const response = await app!.bulletin.create(requestData, adminAccessToken);

      expect(response.statusCode).toBe(400);
    });

    test('when task description is missing', async () => {
      const requestData = generateValidBulletin(440); // Start far in future to avoid conflict
      delete (requestData.days[0].tasks[0] as any).description;

      const response = await app!.bulletin.create(requestData, adminAccessToken);

      expect(response.statusCode).toBe(400);
      expect(response.body.data.message).toContain('description should not be empty');
    });

    test('when daysCount exceeds maximum', async () => {
      const requestData = generateValidBulletin(450); // Start far in future to avoid conflict
      requestData.daysCount = 100; // Exceeds max of 90

      const response = await app!.bulletin.create(requestData, adminAccessToken);

      expect(response.statusCode).toBe(400);
      expect(response.body.data.message).toContain('daysCount must not be greater than 90');
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is not provided', async () => {
      const requestData = generateValidBulletin(460); // Start far in future to avoid conflict

      const response = await app!.bulletin.create(requestData);

      expect(response.statusCode).toBe(401);
      expect(response.body.data.message).toBe(errorKeys.login.User_Not_Authenticated);
    });

    test('when token is invalid', async () => {
      const requestData = generateValidBulletin(470); // Start far in future to avoid conflict

      const response = await app!.bulletin.create(requestData, 'invalid-token');

      expect(response.statusCode).toBe(401);
      expect(response.body.data.message).toBe(errorKeys.login.User_Not_Authenticated);
    });
  });

  describe('POST should respond with a status code of 403', () => {
    test('when user has no AddBulletin permission', async () => {
      const userData = userTestHelpers.generateValidUserWithPassword();
      const newUserResponse = await app!.user.create(userData, adminAccessToken!);
      expect(newUserResponse.statusCode).toBe(201);
      const { data: user }: CreateUserResponseDto = newUserResponse.body;

      // Activate user
      await app!.user.activate(user.id, adminAccessToken!);

      // Login as new user
      const loginResponse = await app!.auth.loginAs({
        email: userData.email,
        passcode: userData.passcode!,
      } satisfies ILoginModel);

      const requestData = generateValidBulletin(480); // Start far in future to avoid conflict

      const response = await app!.bulletin.create(requestData, loginResponse?.accessToken);

      expect(response.statusCode).toBe(403);
      expect(response.body.data.message).toBe(errorKeys.login.User_Not_Authorized);

      // Cleanup
      await app!.user.delete(user.id, adminAccessToken!);
    });
  });

  describe('POST should respond with a status code of 409', () => {
    test('when bulletin title already exists', async () => {
      const baseRequestData = generateValidBulletin(500); // Start far in future to avoid date conflict
      const uniqueTitle = `Duplicate Test ${Date.now()}`;
      
      const requestData1 = { ...baseRequestData, title: uniqueTitle };
      const requestData2 = { ...generateValidBulletin(510), title: uniqueTitle }; // Different date but same title

      // Create first bulletin
      const firstResponse = await app!.bulletin.create(requestData1, adminAccessToken);
      expect(firstResponse.statusCode).toBe(201);

      // Try to create second bulletin with same title
      const secondResponse = await app!.bulletin.create(requestData2, adminAccessToken);

      expect(secondResponse.statusCode).toBe(409);
      expect(secondResponse.body.data.message).toBeDefined();

      // Cleanup - delete the first bulletin
      await app!.bulletin.delete(firstResponse.body.id, adminAccessToken);
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
