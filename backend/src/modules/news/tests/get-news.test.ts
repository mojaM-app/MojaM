import { events, ILoginModel } from '@core';
import { testHelpers } from '@helpers';
import { getAdminLoginData } from '@utils';
import request from 'supertest';
import { Container } from 'typedi';
import { GetNewsResponseDto } from '../dtos/news.dto';
import { NewsRoutes } from '../routes/news.routes';
import { NewsService } from '../services/news.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { TestApp } from './../../../helpers/tests.utils';

describe('GET /news', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await testHelpers.loginAs(app, { email, passcode } satisfies ILoginModel))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('GET should respond with a status code of 200', () => {
    it('when valid request is made', async () => {
      const response = await request(app!.getServer()).get(NewsRoutes.path).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetNewsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.news.retrieved);
      expect(typeof body.data).toBe('object');

      // No event handlers should be called for news module as it doesn't dispatch events yet
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when token is invalid', async () => {
      const response = await request(app!.getServer()).get(NewsRoutes.path).set('Authorization', `Bearer invalid_token_${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetNewsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.news.retrieved);
      expect(typeof body.data).toBe('object');

      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    it('when token is not set', async () => {
      const response = await request(app!.getServer()).get(NewsRoutes.path);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetNewsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.news.retrieved);
      expect(typeof body.data).toBe('object');

      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should handle errors', () => {
    it('when service throws an error', async () => {
      // Mock the NewsService to throw an error
      const newsService = Container.get(NewsService);
      const mockGet = jest.spyOn(newsService, 'get').mockRejectedValue(new Error('Service error'));

      const response = await request(app!.getServer()).get(NewsRoutes.path).set('Authorization', `Bearer ${adminAccessToken}`);

      // The error should be handled by the error middleware, likely returning 500
      expect(response.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();

      // Restore the mock
      mockGet.mockRestore();
    });
  });
});
