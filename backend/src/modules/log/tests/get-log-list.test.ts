import { events, ILoginModel } from '@core';
import { testHelpers } from '@helpers';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { getAdminLoginData } from '@utils';
import { TestApp } from 'helpers/test-helpers/test.app';
import request from 'supertest';
import { GetLogListResponseDto } from '../dtos/get-log-list.dto';
import { LogListRoutes } from '../routes/log-list.routes';

let app: TestApp | undefined;
let adminAccessToken: string | undefined;

describe('GET /log', () => {
  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await app.auth.loginAs({ email, passcode } satisfies ILoginModel))?.accessToken;
  });

  describe('GET should respond with a status code of 200', () => {
    it('when user has permission and logs exist', async () => {
      const response = await app!.logList.get(adminAccessToken);
      expect(response.status).toBe(200);
      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: gridPage, message: getLogListMessage }: GetLogListResponseDto = body;
      expect(getLogListMessage).toBe(events.log.logListRetrieved);
      expect(gridPage).toBeDefined();
      expect(typeof gridPage).toBe('object');
      expect(gridPage.totalCount).toBeDefined();
      expect(typeof gridPage.totalCount).toBe('number');
      expect(gridPage.totalCount).toBeGreaterThan(0);
      expect(gridPage.items).toBeDefined();
      expect(Array.isArray(gridPage.items)).toBe(true);
      expect(gridPage.items.length).toBeGreaterThan(0);
    });

    it('when user has permission with pagination parameters', async () => {
      const response = await request(app!.getServer())
        .get(`${LogListRoutes.path}?page=1&pageSize=10`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: gridPage, message: getLogListMessage }: GetLogListResponseDto = body;
      expect(getLogListMessage).toBe(events.log.logListRetrieved);
      expect(gridPage).toBeDefined();
      expect(typeof gridPage).toBe('object');
      expect(gridPage.totalCount).toBeDefined();
      expect(typeof gridPage.totalCount).toBe('number');
      expect(gridPage.totalCount).toBeGreaterThan(0);
      expect(gridPage.items).toBeDefined();
      expect(Array.isArray(gridPage.items)).toBe(true);
      expect(gridPage.items.length).toBeGreaterThan(0);
    });

    it('when user has permission with level filter', async () => {
      const level = 'ERROR'; // Example log level
      const response = await request(app!.getServer())
        .get(`${LogListRoutes.path}?level=${level}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: gridPage, message: getLogListMessage }: GetLogListResponseDto = body;
      expect(getLogListMessage).toBe(events.log.logListRetrieved);
      expect(gridPage).toBeDefined();
      expect(typeof gridPage).toBe('object');
      expect(gridPage.totalCount).toBeDefined();
      expect(typeof gridPage.totalCount).toBe('number');
      expect(gridPage.totalCount).toBeGreaterThan(0);
      expect(gridPage.items).toBeDefined();
      expect(Array.isArray(gridPage.items)).toBe(true);
      expect(gridPage.items.length).toBeGreaterThan(0);
      expect(gridPage.items.some(item => item.level !== level)).toBe(false);
    });

    it('when user has permission with security events filter', async () => {
      const response = await request(app!.getServer())
        .get(`${LogListRoutes.path}?isSecurityEvent=true`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: gridPage, message: getLogListMessage }: GetLogListResponseDto = body;
      expect(getLogListMessage).toBe(events.log.logListRetrieved);
      expect(gridPage).toBeDefined();
      expect(typeof gridPage).toBe('object');
      expect(gridPage.totalCount).toBeDefined();
      expect(typeof gridPage.totalCount).toBe('number');
      expect(gridPage.totalCount).toBeGreaterThan(0);
      expect(gridPage.items).toBeDefined();
      expect(Array.isArray(gridPage.items)).toBe(true);
      expect(gridPage.items.length).toBeGreaterThan(0);
      expect(gridPage.items.some(item => item.isSecurityEvent !== true)).toBe(false);
    });

    it('when user has permission with date range filter', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const endDate = new Date().toISOString();

      const response = await request(app!.getServer())
        .get(`${LogListRoutes.path}?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const body = response.body;
      expect(typeof body).toBe('object');
      const { data: gridPage, message: getLogListMessage }: GetLogListResponseDto = body;
      expect(getLogListMessage).toBe(events.log.logListRetrieved);
      expect(gridPage).toBeDefined();
      expect(typeof gridPage).toBe('object');
      expect(gridPage.totalCount).toBeDefined();
      expect(typeof gridPage.totalCount).toBe('number');
      expect(gridPage.totalCount).toBeGreaterThan(0);
      expect(gridPage.items).toBeDefined();
      expect(Array.isArray(gridPage.items)).toBe(true);
      expect(gridPage.items.length).toBeGreaterThan(0);
    });

    it('when invalid page parameter is provided', async () => {
      await request(app!.getServer())
        .get(`${LogListRoutes.path}?page=invalid`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
    });

    it('when invalid pageSize parameter is provided', async () => {
      await request(app!.getServer())
        .get(`${LogListRoutes.path}?pageSize=invalid`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
    });

    it('when invalid date format is provided', async () => {
      await request(app!.getServer())
        .get(`${LogListRoutes.path}?startDate=invalid-date`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
    });

    it('when invalid level is provided', async () => {
      await request(app!.getServer())
        .get(`${LogListRoutes.path}?level=INVALID_LEVEL`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
    });

    it('when pageSize exceeds maximum allowed', async () => {
      await request(app!.getServer())
        .get(`${LogListRoutes.path}?pageSize=1000`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
    });
  });

  describe('GET should respond with a status code of 401', () => {
    it('when token is not provided', async () => {
      const response = await app!.logList.get();
      expect(response.status).toBe(401);
    });

    it('when token is invalid', async () => {
      const response = await app!.logList.get('invalid-token');
      expect(response.status).toBe(401);
    });
  });

  // describe('GET should respond with a status code of 403', () => {
  //   it('when user does not have permission', async () => {
  //     const { userToken } = await app.createTestUser([]); // No permissions

  //     await request(app.app).get(LogRoute.path).set('Authorization', `Bearer ${userToken}`).expect(403);
  //   });

  //   it('when user has different permissions but not PreviewLogList', async () => {
  //     const { userToken } = await app.createTestUser([permissionKeys.AddUser]); // Different permission

  //     await request(app.app).get(LogRoute.path).set('Authorization', `Bearer ${userToken}`).expect(403);
  //   });
  // });

  // describe('GET should handle edge cases', () => {
  //   it('when no logs match the filter criteria', async () => {
  //     const { userToken } = await app.createTestUser([permissionKeys.PreviewLogList]);

  //     const response = await request(app.app)
  //       .get('/log?level=CRITICAL') // Assuming no CRITICAL logs exist
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .expect(200);

  //     expect(response.body.data.logs).toHaveLength(0);
  //     expect(response.body.data.totalCount).toBe(0);
  //   });

  //   it('when requesting a page that does not exist', async () => {
  //     const { userToken } = await app.createTestUser([permissionKeys.PreviewLogList]);

  //     const response = await request(app.app)
  //       .get('/log?page=999&pageSize=10')
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .expect(200);

  //     expect(response.body.data.logs).toHaveLength(0);
  //     expect(response.body.data.currentPage).toBe(999);
  //   });

  //   it('when combining multiple filters', async () => {
  //     const { userToken } = await app.createTestUser([permissionKeys.PreviewLogList]);
  //     const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  //     const endDate = new Date().toISOString();

  //     const response = await request(app.app)
  //       .get(`/log?level=INFO&source=application&isSecurityEvent=false&startDate=${startDate}&endDate=${endDate}`)
  //       .set('Authorization', `Bearer ${userToken}`)
  //       .expect(200);

  //     expect(response.body).toHaveProperty('success', true);
  //     expect(response.body.data).toHaveProperty('logs');
  //   });
  // });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
