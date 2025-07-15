import * as config from '@config';
import { events, ILoginModel } from '@core';
import { testHelpers } from '@helpers';
import { getAdminLoginData } from '@utils';
import request from 'supertest';
import { Container } from 'typedi';
import { testEventHandlers } from '../../../helpers/event-handler-tests.helper';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { GetCommunityResponseDto } from '../dtos/community.dto';
import { CommunityRoute } from '../routes/community.routes';
import { CommunityService } from '../services/community.service';

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
    it('when valid request is made and COMMUNITY_INFO_URL is undefined', async () => {
      const response = await request(app!.getServer())
        .get(CommunityRoute.path)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetCommunityResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.community.communityRetrieved);
      expect(typeof body.data).toBe('object');
      expect(body.data.info).toBeDefined();
      expect(body.data.tabs).toBeDefined();

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCommunityRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCommunityRetrieved).toHaveBeenCalledTimes(1);
    });

    it('when valid request is made and COMMUNITY_INFO_URL is set', async () => {
      jest.replaceProperty(config, 'COMMUNITY_INFO_URL', 'https://jsonplaceholder.typicode.com/todos/1');
      const response = await request(app!.getServer())
        .get(CommunityRoute.path)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetCommunityResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.community.communityRetrieved);
      expect(typeof body.data).toBe('object');
      expect(body.data.info).toBeDefined();
      expect(body.data.tabs).toBeDefined();

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCommunityRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCommunityRetrieved).toHaveBeenCalledTimes(1);
    });

    it('when valid request is made and COMMUNITY_INFO_URL is set but url is invalid', async () => {
      jest.replaceProperty(config, 'COMMUNITY_INFO_URL', 'https://invalid-url.domain.com');
      const response = await request(app!.getServer())
        .get(CommunityRoute.path)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetCommunityResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.community.communityRetrieved);
      expect(typeof body.data).toBe('object');
      expect(body.data.info).toBeDefined();
      expect(body.data.tabs).toBeDefined();

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCommunityRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCommunityRetrieved).toHaveBeenCalledTimes(1);
    });

    it('when token is invalid', async () => {
      const response = await request(app!.getServer())
        .get(CommunityRoute.path)
        .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetCommunityResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.community.communityRetrieved);
      expect(typeof body.data).toBe('object');
      expect(body.data.info).toBeDefined();
      expect(body.data.tabs).toBeDefined();

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCommunityRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCommunityRetrieved).toHaveBeenCalledTimes(1);
    });

    it('when token is not set', async () => {
      const response = await request(app!.getServer()).get(CommunityRoute.path);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body as GetCommunityResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.community.communityRetrieved);
      expect(typeof body.data).toBe('object');
      expect(body.data.info).toBeDefined();
      expect(body.data.tabs).toBeDefined();

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCommunityRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCommunityRetrieved).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET should handle errors', () => {
    it('when service throws an error', async () => {
      const communityService = Container.get(CommunityService);
      const mockGet = jest.spyOn(communityService, 'get').mockRejectedValue(new Error('Service error'));
      const response = await request(app!.getServer())
        .get(CommunityRoute.path)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(response.statusCode).toBe(500);
      expect(mockGet).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
