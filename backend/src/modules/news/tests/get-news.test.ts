import { events, ILoginModel } from '@core';
import { testHelpers } from '@helpers';
import { getAdminLoginData } from '@utils';
import { Container } from 'typedi';
import { testEventHandlers } from '../../../helpers/event-handler-tests.helper';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { GetNewsResponseDto } from '../dtos/news.dto';
import { NewsService } from '../services/news.service';

describe('GET /news', () => {
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

  describe('GET should respond with a status code of 200', () => {
    it('when valid request is made', async () => {
      const response = await app!.news.get(adminAccessToken);
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetNewsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.news.newsRetrieved);
      expect(typeof body.data).toBe('object');

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onNewsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onNewsRetrieved).toHaveBeenCalledTimes(1);
    });

    it('when token is invalid', async () => {
      const response = await app!.news.get(`Bearer invalid_token_${adminAccessToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetNewsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.news.newsRetrieved);
      expect(typeof body.data).toBe('object');

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onNewsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onNewsRetrieved).toHaveBeenCalledTimes(1);
    });

    it('when token is not set', async () => {
      const response = await app!.news.get();
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetNewsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.news.newsRetrieved);
      expect(typeof body.data).toBe('object');

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onNewsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onNewsRetrieved).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should handle errors', () => {
    it('when service throws an error', async () => {
      const newsService = Container.get(NewsService);
      const mockGet = jest.spyOn(newsService, 'get').mockRejectedValue(new Error('Service error'));
      const response = await app!.news.get(adminAccessToken);
      expect(response.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
