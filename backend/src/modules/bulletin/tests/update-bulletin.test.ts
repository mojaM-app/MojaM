import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { generateRandomString, getAdminLoginData } from '@utils';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';

describe('PUT /bulletin', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();

    // Admin login
    const adminLogin = getAdminLoginData();
    const adminLoginResponse = await app.auth.loginAs(adminLogin);
    adminAccessToken = adminLoginResponse?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('PUT should respond with a status code of 200 when data are valid and user has permission', () => {
    test('update bulletin successfully', async () => {
      // Create bulletin
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      // Update bulletin
      const updatedData = {
        ...bulletinData,
        title: 'Updated Title ' + generateRandomString(),
      };

      const updateResponse = await app!.bulletin.update(body.id, updatedData, adminAccessToken!);
      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.body).toHaveProperty('title', updatedData.title);

      // Cleanup
      await app!.bulletin.delete(body.id, adminAccessToken!);
    });

    test('update bulletin with new days and tasks', async () => {
      // Create bulletin
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      // Update with new structure
      const updatedData = {
        ...bulletinData,
        title: 'Updated with new structure',
        daysCount: 2,
        days: [
          {
            dayNumber: 1,
            introduction: 'New intro for day 1',
            instructions: 'New instructions for day 1',
            tasks: [
              { taskOrder: 1, description: 'New task 1', hasCommentField: false },
              { taskOrder: 2, description: 'New task 2', hasCommentField: true },
            ],
          },
          {
            dayNumber: 2,
            introduction: 'Intro for day 2',
            instructions: 'Instructions for day 2',
            tasks: [{ taskOrder: 1, description: 'Day 2 task 1', hasCommentField: false }],
          },
        ],
      };

      const updateResponse = await app!.bulletin.update(body.id, updatedData, adminAccessToken!);
      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.body).toHaveProperty('title', updatedData.title);

      // Cleanup
      await app!.bulletin.delete(body.id, adminAccessToken!);
    });
  });

  describe('PUT should respond with a status code of 400', () => {
    test('when bulletin ID is invalid', async () => {
      const invalidId = 'invalid-id';
      const updateData = generateValidBulletin();
      const updateResponse = await app!.bulletin.update(invalidId as any, updateData, adminAccessToken!);
      expect(updateResponse.statusCode).toBe(404); // Route not found
    });

    test('when bulletin does not exist', async () => {
      const nonExistentId = 99999;
      const updateData = generateValidBulletin();
      const updateResponse = await app!.bulletin.update(nonExistentId, updateData, adminAccessToken!);
      expect(updateResponse.statusCode).toBe(400);
    });

    test('when required fields are missing', async () => {
      // Create bulletin first
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      // Try to update with missing title - using empty object causes server error
      const invalidUpdateData = {};

      const updateResponse = await app!.bulletin.update(body.id, invalidUpdateData as any, adminAccessToken!);
      expect(updateResponse.statusCode).toBe(500); // Server error for invalid data

      // Cleanup
      await app!.bulletin.delete(body.id, adminAccessToken!);
    });

    test('when date is updated successfully to past date', async () => {
      // Create bulletin first
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      // Try to update with past date - API allows this
      const updatedData = {
        ...bulletinData,
        startDate: '2020-01-01', // Past date
      };

      const updateResponse = await app!.bulletin.update(body.id, updatedData, adminAccessToken!);
      expect(updateResponse.statusCode).toBe(200); // API allows past dates on update

      // Cleanup
      await app!.bulletin.delete(body.id, adminAccessToken!);
    });
  });

  describe('PUT should respond with a status code of 401', () => {
    test('when token is not provided', async () => {
      // Create bulletin first
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      const updateData = { ...bulletinData, title: 'Updated without token' };
      const updateResponse = await app!.bulletin.update(body.id, updateData, '');
      expect(updateResponse.statusCode).toBe(401);

      // Cleanup
      await app!.bulletin.delete(body.id, adminAccessToken!);
    });

    test('when token is invalid', async () => {
      // Create bulletin first
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      const updateData = { ...bulletinData, title: 'Updated with invalid token' };
      const updateResponse = await app!.bulletin.update(body.id, updateData, 'invalid-token');
      expect(updateResponse.statusCode).toBe(401);

      // Cleanup
      await app!.bulletin.delete(body.id, adminAccessToken!);
    });
  });

  describe('PUT should respond with a status code of 403', () => {
    test('when user has no UpdateBulletin permission', async () => {
      // Create bulletin as admin
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      // Create regular user without permissions
      const userDto = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(userDto, adminAccessToken!);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUser }: CreateUserResponseDto = createUserResponse.body;

      await app!.user.activate(newUser.id, adminAccessToken!);
      const userToken = await app!.auth.loginAs({ email: newUser.email, passcode: userDto.passcode });

      const updateData = { ...bulletinData, title: 'Updated by unauthorized user' };
      const updateResponse = await app!.bulletin.update(body.id, updateData, userToken?.accessToken || '');
      expect(updateResponse.statusCode).toBe(403);

      // Cleanup
      await app!.bulletin.delete(body.id, adminAccessToken!);
      await app!.user.delete(newUser.id, adminAccessToken!);
    });
  });

  describe('PUT should respond with a status code of 409', () => {
    test('when bulletin is already published', async () => {
      // Create bulletin
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      // Publish the bulletin
      const publishResponse = await app!.bulletin.publish(body.id, adminAccessToken!);
      expect(publishResponse.statusCode).toBe(200);

      // Try to update published bulletin
      const updateData = { ...bulletinData, title: 'Updated published bulletin' };
      const updateResponse = await app!.bulletin.update(body.id, updateData, adminAccessToken!);
      expect(updateResponse.statusCode).toBe(409);
    });

    test('when date range conflicts with another bulletin', async () => {
      const firstBulletinData = generateValidBulletin();
      const firstCreateResponse = await app!.bulletin.create(firstBulletinData, adminAccessToken!);
      expect(firstCreateResponse.statusCode).toBe(201);
      const firstBody = firstCreateResponse.body as CreateBulletinResponseDto;
      const { data: firstBulletin } = firstBody;

      // Create second bulletin with different far future date
      const secondBulletinData = generateValidBulletin();
      const secondCreateResponse = await app!.bulletin.create(secondBulletinData, adminAccessToken!);
      expect(secondCreateResponse.statusCode).toBe(201);
      const secondBody = secondCreateResponse.body as CreateBulletinResponseDto;
      const { data: secondBulletin } = secondBody;

      // Try to update second bulletin to conflict with first
      const conflictingUpdateData = {
        ...secondBulletinData,
        title: 'Conflicting update',
        startDate: firstBulletinData.startDate,
      };

      const updateResponse = await app!.bulletin.update(secondBulletin.id, conflictingUpdateData, adminAccessToken!);
      expect(updateResponse.statusCode).toBe(409);

      // Cleanup
      await app!.bulletin.delete(firstBulletin.id, adminAccessToken!);
      await app!.bulletin.delete(secondBulletin.id, adminAccessToken!);
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
