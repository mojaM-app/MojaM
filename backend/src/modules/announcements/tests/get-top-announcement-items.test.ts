import { GET_TOP_ANNOUNCEMENTS_ITEMS } from '@config';
import { events, ILoginModel, SystemPermissions } from '@core';
import { errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto } from '@modules/users';
import { generateValidUserWithPassword } from '@modules/users/tests/test.helpers';
import { getAdminLoginData } from '@utils';
import { generateValidAnnouncements } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateAnnouncementsResponseDto } from '../dtos/create-announcements.dto';
import {
  GetTopAnnouncementItemsReqDto,
  GetTopAnnouncementItemsResponseDto,
  TopAnnouncementItemDto,
} from '../dtos/get-top-announcement-items.dto';
import { AnnouncementsService } from '../services/announcements.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('POST /announcements/top-items', () => {
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

  describe('POST should respond with a status code of 200 when user has permission', () => {
    test('get top 5 announcement items with multiple published announcements', async () => {
      // Create and publish multiple announcements with different content patterns
      const announcements: string[] = [];

      // Create announcement with repeated content
      for (let i = 0; i < 3; i++) {
        const requestData = generateValidAnnouncements();
        requestData.items = [
          { content: 'Most popular content' },
          { content: 'Second popular content' },
          { content: 'Less popular content' },
        ];

        const createResponse = await app!.announcements.create(requestData, adminAccessToken);
        expect(createResponse.statusCode).toBe(201);
        const { data: saveAnnouncementsResult }: CreateAnnouncementsResponseDto = createResponse.body;

        const publishResponse = await app!.announcements.publish(saveAnnouncementsResult!.id, adminAccessToken);
        expect(publishResponse.statusCode).toBe(200);

        announcements.push(saveAnnouncementsResult!.id);
      }

      // Create additional announcement with unique content
      const uniqueRequestData = generateValidAnnouncements();
      uniqueRequestData.items = [
        { content: 'Most popular content' }, // This should be most frequent
        { content: 'Unique content only once' },
      ];

      const uniqueCreateResponse = await app!.announcements.create(uniqueRequestData, adminAccessToken);
      expect(uniqueCreateResponse.statusCode).toBe(201);
      const { data: saveAnnouncementsResult }: CreateAnnouncementsResponseDto = uniqueCreateResponse.body;

      const uniquePublishResponse = await app!.announcements.publish(saveAnnouncementsResult!.id, adminAccessToken);
      expect(uniquePublishResponse.statusCode).toBe(200);

      announcements.push(saveAnnouncementsResult!.id);

      // Test the endpoint
      const response = await app!.announcements.getTopItems(adminAccessToken, []);
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));

      const body = response.body;
      expect(typeof body).toBe('object');

      const { data: topItems, message }: GetTopAnnouncementItemsResponseDto = body;
      expect(message).toBe(events.announcements.announcementsItemsRetrieved);
      expect(Array.isArray(topItems)).toBe(true);
      expect(topItems.length).toBeGreaterThan(0);

      // Verify the structure and ordering
      const firstItem = topItems[0] as TopAnnouncementItemDto;
      expect(firstItem.content).toBe('Most popular content');
      expect(firstItem.count).toBe(4); // Should appear 4 times
      expect(typeof firstItem.count).toBe('number');

      // Verify ordering by count (descending)
      for (let i = 1; i < topItems.length; i++) {
        expect(topItems[i].count).toBeLessThanOrEqual(topItems[i - 1].count);
      }

      // Cleanup
      for (const announcementId of announcements) {
        const deleteResponse = await app!.announcements.delete(announcementId, adminAccessToken);
        expect(deleteResponse.statusCode).toBe(200);
      }

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsPublished,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(4);
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalledTimes(4);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(4);
    });

    test('get top announcement items with limit from environment', async () => {
      // Create announcements with various content
      const announcements: string[] = [];

      const requestData = generateValidAnnouncements();
      requestData.items = [
        { content: 'Content A' },
        { content: 'Content B' },
        { content: 'Content C' },
        { content: 'Content D' },
        { content: 'Content E' },
      ];

      const createResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createResponse.statusCode).toBe(201);
      const { data: saveAnnouncementsResult }: CreateAnnouncementsResponseDto = createResponse.body;

      const publishResponse = await app!.announcements.publish(saveAnnouncementsResult!.id, adminAccessToken);
      expect(publishResponse.statusCode).toBe(200);
      announcements.push(saveAnnouncementsResult!.id);

      // Test with limit of 3
      const response = await app!.announcements.getTopItems(adminAccessToken, []);
      expect(response.statusCode).toBe(200);

      const { data: topItems }: GetTopAnnouncementItemsResponseDto = response.body;
      expect(topItems.length).toBeLessThanOrEqual(Number(GET_TOP_ANNOUNCEMENTS_ITEMS) || 10); // Should be limited by environment config

      // All items should have count of 1 in this case
      topItems.forEach((item: TopAnnouncementItemDto) => {
        expect(item.count).toBe(1);
      });

      // Cleanup
      for (const id of announcements) {
        const deleteResponse = await app!.announcements.delete(id, adminAccessToken);
        expect(deleteResponse.statusCode).toBe(200);
      }
    });

    test('get top announcement items with excludeItems parameter', async () => {
      // Create announcements with specific content for testing exclusion
      const announcements: string[] = [];

      const requestData = generateValidAnnouncements();
      requestData.items = [
        { content: 'Include this content' },
        { content: 'Exclude this content' },
        { content: 'Also exclude this' },
        { content: 'Keep this content' },
        { content: 'Include this content' }, // Duplicate to increase count
        { content: 'Exclude this content' }, // Duplicate to increase count
      ];

      const createResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createResponse.statusCode).toBe(201);
      const { data: saveAnnouncementsResult }: CreateAnnouncementsResponseDto = createResponse.body;

      const publishResponse = await app!.announcements.publish(saveAnnouncementsResult!.id, adminAccessToken);
      expect(publishResponse.statusCode).toBe(200);
      announcements.push(saveAnnouncementsResult!.id);

      // First, get all top items without exclusion
      const allItemsResponse = await app!.announcements.getTopItems(adminAccessToken, []);
      expect(allItemsResponse.statusCode).toBe(200);
      const { data: allItems }: GetTopAnnouncementItemsResponseDto = allItemsResponse.body;

      // Verify we have the items we expect
      const includeItem = allItems.find(item => item.content === 'Include this content');
      const excludeItem = allItems.find(item => item.content === 'Exclude this content');
      const alsoExcludeItem = allItems.find(item => item.content === 'Also exclude this');
      const keepItem = allItems.find(item => item.content === 'Keep this content');

      expect(includeItem).toBeDefined();
      expect(excludeItem).toBeDefined();
      expect(alsoExcludeItem).toBeDefined();
      expect(keepItem).toBeDefined();

      // Now test with excludeItems parameter
      const excludeItems = [
        { id: excludeItem!.id, content: excludeItem!.content },
        { id: alsoExcludeItem!.id, content: alsoExcludeItem!.content },
      ];

      const filteredResponse = await app!.announcements.getTopItems(adminAccessToken, excludeItems);
      expect(filteredResponse.statusCode).toBe(200);
      const { data: filteredItems }: GetTopAnnouncementItemsResponseDto = filteredResponse.body;

      // Verify excluded items are not present
      const excludedContent1 = filteredItems.find(item => item.content === 'Exclude this content');
      const excludedContent2 = filteredItems.find(item => item.content === 'Also exclude this');
      expect(excludedContent1).toBeUndefined();
      expect(excludedContent2).toBeUndefined();

      // Verify included items are still present
      const includedContent1 = filteredItems.find(item => item.content === 'Include this content');
      const includedContent2 = filteredItems.find(item => item.content === 'Keep this content');
      expect(includedContent1).toBeDefined();
      expect(includedContent2).toBeDefined();
      expect(includedContent1!.count).toBe(2); // Should appear twice

      // Cleanup
      for (const id of announcements) {
        const deleteResponse = await app!.announcements.delete(id, adminAccessToken);
        expect(deleteResponse.statusCode).toBe(200);
      }
    });

    test('get top announcement items when no published announcements exist', async () => {
      // Create unpublished announcement (should not be included)
      const requestData = generateValidAnnouncements();
      requestData.items = [{ content: 'Unpublished content' }];

      const createResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createResponse.statusCode).toBe(201);
      const { data: saveAnnouncementsResult }: CreateAnnouncementsResponseDto = createResponse.body;

      // Test the endpoint - should return empty array
      const response = await app!.announcements.getTopItems(adminAccessToken, []);
      expect(response.statusCode).toBe(200);

      const { data: topItems }: GetTopAnnouncementItemsResponseDto = response.body;
      expect(Array.isArray(topItems)).toBe(true);
      expect(topItems.length).toBe(0);

      // Cleanup
      const deleteResponse = await app!.announcements.delete(saveAnnouncementsResult!.id, adminAccessToken);
      expect(deleteResponse.statusCode).toBe(200);
    });
  });

  describe('POST should respond with a status code of 401 when user is not authenticated', () => {
    test('when access token is not provided', async () => {
      const response = await app!.announcements.getTopItems(undefined, []);
      expect(response.statusCode).toBe(401);
      const data = response.body.data as UnauthorizedException;
      expect(data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when access token is invalid', async () => {
      const response = await app!.announcements.getTopItems('invalid_token', []);
      expect(response.statusCode).toBe(401);
      const data = response.body.data as UnauthorizedException;
      expect(data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('POST should respond with a status code of 403 when user does not have permission', () => {
    test('when user does not have add/edit announcements permission', async () => {
      const userData = generateValidUserWithPassword();
      const newUserResponse = await app!.user.create(userData, adminAccessToken);
      expect(newUserResponse.statusCode).toBe(201);
      const { data: user }: CreateUserResponseDto = newUserResponse.body;

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: userData.email, passcode: userData.passcode } satisfies ILoginModel)
      )?.accessToken;

      const response = await app!.announcements.getTopItems(newUserAccessToken, []);
      expect(response.statusCode).toBe(403);
      const data = response.body.data as UnauthorizedException;
      expect(data.message).toBe(errorKeys.login.User_Not_Authorized);

      // Cleanup
      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
    });

    test('when user has all permissions except add/edit announcements', async () => {
      const userData = generateValidUserWithPassword();
      const newUserResponse = await app!.user.create(userData, adminAccessToken);
      expect(newUserResponse.statusCode).toBe(201);
      const { data: user }: CreateUserResponseDto = newUserResponse.body;

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(user.id, adminAccessToken, [
        SystemPermissions.AddAnnouncements,
        SystemPermissions.EditAnnouncements,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: userData.email, passcode: userData.passcode } satisfies ILoginModel)
      )?.accessToken;

      const response = await app!.announcements.getTopItems(newUserAccessToken, []);
      expect(response.statusCode).toBe(403);

      // Cleanup
      const deleteUserResponse = await app!.user.delete(user.id, adminAccessToken);
      expect(deleteUserResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onUserCreated,
              testEventHandlers.onUserActivated,
              testEventHandlers.onUserLoggedIn,
              testEventHandlers.onUserDeleted,
              testEventHandlers.onPermissionAdded,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
      expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
      expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
      expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
      expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('when error occurs in the service', async () => {
      jest
        .spyOn(AnnouncementsService.prototype, 'getTopAnnouncementItems')
        .mockImplementation(async (_reqDto: GetTopAnnouncementItemsReqDto) => {
          throw new Error('Test service error');
        });

      const response = await app!.announcements.getTopItems(adminAccessToken, []);
      expect(response.statusCode).toBe(500);
      const body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe('Test service error');

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
