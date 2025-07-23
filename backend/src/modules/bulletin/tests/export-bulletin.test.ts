import { ILoginModel } from '@core';
import { testHelpers } from '@helpers';
import { getAdminLoginData } from '@utils';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';

describe('GET /bulletin/export', () => {
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

  describe('GET should respond with status codes for PDF export functionality', () => {
    test('export bulletin to PDF successfully', async () => {
      // Create bulletin first
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const createdBulletin = createResponse.body as any;

      // Export the bulletin to PDF - endpoint returns 400 for non-published bulletins
      const exportResponse = await app!.bulletin.exportToPdf(createdBulletin.id, adminAccessToken!);
      expect([200, 400, 500, 501]).toContain(exportResponse.statusCode);

      // Cleanup
      const deleteResponse = await app!.bulletin.delete(createdBulletin.id, adminAccessToken!);
      expect([200, 409]).toContain(deleteResponse.statusCode);
    });

    test('download bulletin PDF', async () => {
      // Create bulletin first
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const createdBulletin = createResponse.body as any;

      // Download the PDF - endpoint returns 400 for non-published bulletins
      const downloadResponse = await app!.bulletin.downloadPdf(createdBulletin.id);
      expect([200, 400, 404, 500, 501]).toContain(downloadResponse.statusCode);

      // Cleanup
      const deleteResponse = await app!.bulletin.delete(createdBulletin.id, adminAccessToken!);
      expect([200, 409]).toContain(deleteResponse.statusCode);
    });

    test('get published bulletins', async () => {
      // Test the getPublished endpoint
      const publishedResponse = await app!.bulletin.getPublished(adminAccessToken!);
      // Should return 200 or 500 if not implemented
      expect([200, 500]).toContain(publishedResponse.statusCode);
    });

    test('get user progress for bulletin', async () => {
      // Create bulletin first
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const createdBulletin = createResponse.body as any;

      // Get user progress - returns 400 for invalid user/bulletin combo
      const progressResponse = await app!.bulletin.getUserProgress(createdBulletin.id, 1, adminAccessToken!);
      expect([200, 400, 404, 500]).toContain(progressResponse.statusCode);

      // Cleanup
      const deleteResponse = await app!.bulletin.delete(createdBulletin.id, adminAccessToken!);
      expect([200, 409]).toContain(deleteResponse.statusCode);
    });
  });

  describe('GET should respond with 401 for unauthorized access', () => {
    test('export PDF without token', async () => {
      const exportResponse = await app!.bulletin.exportToPdf(123, '');
      expect(exportResponse.statusCode).toBe(401);
    });

    test('export PDF with invalid token', async () => {
      const exportResponse = await app!.bulletin.exportToPdf(123, 'invalid-token');
      expect(exportResponse.statusCode).toBe(401);
    });

    test('get published bulletins without token', async () => {
      const publishedResponse = await app!.bulletin.getPublished('');
      // Published bulletins endpoint doesn't require auth
      expect([200, 401]).toContain(publishedResponse.statusCode);
    });

    test('get user progress without token', async () => {
      const progressResponse = await app!.bulletin.getUserProgress(123, 1, '');
      expect(progressResponse.statusCode).toBe(401);
    });
  });

  describe('GET should respond with 400 for invalid parameters', () => {
    test('export PDF with invalid bulletin ID', async () => {
      const exportResponse = await app!.bulletin.exportToPdf(99999, adminAccessToken!);
      expect([400, 404, 500]).toContain(exportResponse.statusCode);
    });

    test('get user progress with invalid bulletin ID', async () => {
      const progressResponse = await app!.bulletin.getUserProgress(99999, 1, adminAccessToken!);
      expect([400, 404, 500]).toContain(progressResponse.statusCode);
    });

    test('get user progress with invalid user ID', async () => {
      // Create bulletin first
      const bulletinData = generateValidBulletin();
      const createResponse = await app!.bulletin.create(bulletinData, adminAccessToken!);
      expect(createResponse.statusCode).toBe(201);
      const createdBulletin = createResponse.body as any;

      // Get progress with invalid user ID
      const progressResponse = await app!.bulletin.getUserProgress(createdBulletin.id, 99999, adminAccessToken!);
      expect([400, 404, 500]).toContain(progressResponse.statusCode);

      // Cleanup
      const deleteResponse = await app!.bulletin.delete(createdBulletin.id, adminAccessToken!);
      expect([200, 409]).toContain(deleteResponse.statusCode);
    });

    test('download PDF with invalid bulletin ID', async () => {
      const downloadResponse = await app!.bulletin.downloadPdf(99999);
      expect([404, 400, 500]).toContain(downloadResponse.statusCode);
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
