import { ILoginModel, SystemPermissions } from '@core';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { getAdminLoginData } from '@utils';
import { Guid } from 'guid-typescript';
import { generateValidBulletin } from './test.helpers';
import type { TestApp } from '../../../helpers/test-helpers/test.app';

describe('DELETE /bulletin', () => {
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
    test('delete bulletin successfully', async () => {
      // Create a bulletin first
      const bulletinData = generateValidBulletin(400); // Far future to avoid conflicts
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      // Delete the bulletin
      const deleteResponse = await app!.bulletin.delete(body.id, adminAccessToken!);
      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({ success: true });
    });

    test('delete bulletin in draft state', async () => {
      // Create a draft bulletin
      const bulletinData = generateValidBulletin(450);
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      // Verify it's in draft state
      expect(body.state).toBe(1); // Draft state

      // Delete the bulletin
      const deleteResponse = await app!.bulletin.delete(body.id, adminAccessToken!);
      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({ success: true });
    });

    test('delete published bulletin', async () => {
      // Create a published bulletin
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      // Publish the bulletin
      const publishDto = { bulletinId: body.id };
      const publishResponse = await app!.bulletin.publish(body.id, publishDto, adminAccessToken!);
      expect(publishResponse.statusCode).toBe(200);

      // Delete the bulletin
      const deleteResponse = await app!.bulletin.delete(body.id, adminAccessToken!);
      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({ success: true });
    });
  });

  describe('DELETE should respond with a status code of 400', () => {
    test('when bulletin ID is invalid', async () => {
      const invalidId = 'invalid-id';
      const deleteResponse = await app!.bulletin.delete(invalidId as any, adminAccessToken!);
      expect(deleteResponse.statusCode).toBe(404); // Route not found for invalid ID format
    });

    test('when bulletin does not exist', async () => {
      const nonExistentId = 99999;
      const deleteResponse = await app!.bulletin.delete(nonExistentId, adminAccessToken!);
      expect(deleteResponse.statusCode).toBe(400);
    });
  });

  describe('DELETE should respond with a status code of 401', () => {
    test('when token is not provided', async () => {
      const bulletinData = generateValidBulletin(500);
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      const deleteResponse = await app!.bulletin.delete(body.id, '');
      expect(deleteResponse.statusCode).toBe(401);

      // Cleanup
      await app!.bulletin.delete(body.id, adminAccessToken!);
    });

    test('when token is invalid', async () => {
      const bulletinData = generateValidBulletin(510);
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const body = createResponse.body as any;

      const invalidToken = 'invalid-token';
      const deleteResponse = await app!.bulletin.delete(body.id, invalidToken);
      expect(deleteResponse.statusCode).toBe(401);

      // Cleanup
      await app!.bulletin.delete(body.id, adminAccessToken!);
    });
  });

  describe('DELETE should respond with a status code of 403', () => {
    test('when user has no DeleteBulletin permission', async () => {
      // Create user without permissions
      const userDto = userTestHelpers.generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(userDto, adminAccessToken!);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: newUser }: CreateUserResponseDto = createUserResponse.body;

      const activateNewUserResponse = await app!.user.activate(newUser.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(newUser.id, adminAccessToken, [
        SystemPermissions.DeleteBulletin,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: newUser.email, passcode: userDto.passcode } satisfies ILoginModel)
      )?.accessToken;

      const deleteBulletinResponse = await app!.bulletin.delete(0, newUserAccessToken);
      expect(deleteBulletinResponse.statusCode).toBe(403);

      // Cleanup
      await app!.user.delete(newUser.id, adminAccessToken!);
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
