/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { registerTestEventHandlers, testEventHandlers } from '@helpers/event-handler-test.helpers';
import { loginAs } from '@helpers/user-tests.helpers';
import {
  AnnouncementsRout,
  AnnouncementStateValue,
  CreateAnnouncementsResponseDto,
  GetAnnouncementsResponseDto,
  UpdateAnnouncementsDto,
  UpdateAnnouncementsResponseDto,
} from '@modules/announcements';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { UserRoute } from '@modules/users';
import { isGuid } from '@utils';
import { generateRandomDate, getAdminLoginData } from '@utils/tests.utils';
import { isDateString } from 'class-validator';
import { EventDispatcher } from 'event-dispatch';
import request from 'supertest';
import { generateValidAnnouncements } from './announcements-tests.helpers';

describe('PUT /announcements', () => {
  const announcementRoute = new AnnouncementsRout();
  const userRoute = new UserRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App();

  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    await app.initialize([userRoute, permissionsRoute, announcementRoute]);
    const { email: login, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email: login, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('PUT should respond with a status code of 200 when data are valid and user has permission', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    test('update should add new item', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: [...announcementsBeforeUpdate.items, { id: '', content: 'new item' }],
      };
      expect(updateAnnouncementsModel.title).toBeUndefined();
      expect(updateAnnouncementsModel.validFromDate).toBeUndefined();
      announcementsBeforeUpdate.items.forEach((item, index) => {
        expect(updateAnnouncementsModel.items![index].content).toBe(item.content);
      });
      expect(announcementsBeforeUpdate.items.length).toBeLessThan(updateAnnouncementsModel.items!.length);

      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsAfterUpdate, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcementsAfterUpdate).toBeDefined();
      expect(announcementsAfterUpdate.id).toBeDefined();
      expect(isGuid(announcementsAfterUpdate.id)).toBe(true);
      expect(announcementsAfterUpdate.createdBy.length).toBeGreaterThan(0);
      expect(announcementsAfterUpdate.createdAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.createdAt)).toBe(true);
      expect(announcementsAfterUpdate.updatedAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.updatedAt)).toBe(true);
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsAfterUpdate.createdAt);
      // expect(announcementsBeforeUpdate.updatedAt).not.toBe(announcementsAfterUpdate.updatedAt);
      // expect(new Date(announcementsAfterUpdate.updatedAt).getTime()).toBeGreaterThan(new Date(announcementsBeforeUpdate.updatedAt).getTime());
      expect(announcementsAfterUpdate.title).toBe(announcementsBeforeUpdate.title);
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(new Date(announcementsAfterUpdate.validFromDate!)).toEqual(new Date(announcementsBeforeUpdate.validFromDate!));
      expect(announcementsAfterUpdate.items).toBeDefined();
      expect(Array.isArray(announcementsAfterUpdate.items)).toBe(true);
      expect(announcementsBeforeUpdate.items.length).toBeLessThan(announcementsAfterUpdate.items.length);
      expect(announcementsAfterUpdate.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.content.length > 0)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedBy === undefined)).toBe(true);
      announcementsAfterUpdate.items.forEach((item, index) => {
        expect(updateAnnouncementsModel.items![index].content).toBe(item.content);
        // expect(announcementsBeforeUpdate.items[index].content).not.toBe(item.content);
      });
      // const lastItemId = announcementsBeforeUpdate.items[announcementsBeforeUpdate.items.length - 1].id;
      // expect(announcementsAfterUpdate.items.every(item => item.id !== lastItemId)).toBe(true);

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('update should delete one item', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: announcementsBeforeUpdate.items.splice(-1).map((item, index) => ({ id: item.id, content: `${index + 1}_New_Content_${item.id}` })),
      };
      expect(updateAnnouncementsModel.title).toBeUndefined();
      expect(updateAnnouncementsModel.validFromDate).toBeUndefined();
      updateAnnouncementsModel.items!.forEach((item, index) => {
        expect(announcementsBeforeUpdate.items[index].content).not.toBe(item.content);
      });
      expect(announcementsBeforeUpdate.items.length).toBeGreaterThan(updateAnnouncementsModel.items!.length);

      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsAfterUpdate, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcementsAfterUpdate).toBeDefined();
      expect(announcementsAfterUpdate.id).toBeDefined();
      expect(isGuid(announcementsAfterUpdate.id)).toBe(true);
      expect(announcementsAfterUpdate.createdBy.length).toBeGreaterThan(0);
      expect(announcementsAfterUpdate.createdAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.createdAt)).toBe(true);
      expect(announcementsAfterUpdate.updatedAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.updatedAt)).toBe(true);
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsAfterUpdate.createdAt);
      // expect(announcementsBeforeUpdate.updatedAt).not.toBe(announcementsAfterUpdate.updatedAt);
      // expect(new Date(announcementsAfterUpdate.updatedAt).getTime()).toBeGreaterThan(new Date(announcementsBeforeUpdate.updatedAt).getTime());
      expect(announcementsAfterUpdate.title).toBe(announcementsBeforeUpdate.title);
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(new Date(announcementsAfterUpdate.validFromDate!)).toEqual(new Date(announcementsBeforeUpdate.validFromDate!));
      expect(announcementsAfterUpdate.items).toBeDefined();
      expect(Array.isArray(announcementsAfterUpdate.items)).toBe(true);
      expect(announcementsBeforeUpdate.items.length).toBeGreaterThan(announcementsAfterUpdate.items.length);
      expect(announcementsAfterUpdate.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.content.length > 0)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedBy !== undefined)).toBe(true);
      announcementsAfterUpdate.items.forEach((item, index) => {
        expect(updateAnnouncementsModel.items![index].content).toBe(item.content);
        expect(announcementsBeforeUpdate.items[index].content).not.toBe(item.content);
      });
      const lastItemId = announcementsBeforeUpdate.items[announcementsBeforeUpdate.items.length - 1].id;
      expect(announcementsAfterUpdate.items.every(item => item.id !== lastItemId)).toBe(true);

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('update should change items content', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: announcementsBeforeUpdate.items.map((item, index) => ({ id: item.id, content: `${index + 1}_New_Content_${item.id}` })),
      };
      expect(updateAnnouncementsModel.title).toBeUndefined();
      expect(updateAnnouncementsModel.validFromDate).toBeUndefined();
      announcementsBeforeUpdate.items.forEach((item, index) => {
        expect(updateAnnouncementsModel.items![index].content).not.toBe(item.content);
      });

      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsAfterUpdate, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcementsAfterUpdate).toBeDefined();
      expect(announcementsAfterUpdate.id).toBeDefined();
      expect(isGuid(announcementsAfterUpdate.id)).toBe(true);
      expect(announcementsAfterUpdate.createdBy.length).toBeGreaterThan(0);
      expect(announcementsAfterUpdate.createdAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.createdAt)).toBe(true);
      expect(announcementsAfterUpdate.updatedAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.updatedAt)).toBe(true);
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsAfterUpdate.createdAt);
      // expect(announcementsBeforeUpdate.updatedAt).not.toBe(announcementsAfterUpdate.updatedAt);
      // expect(new Date(announcementsAfterUpdate.updatedAt).getTime()).toBeGreaterThan(new Date(announcementsBeforeUpdate.updatedAt).getTime());
      expect(announcementsAfterUpdate.title).toBe(announcementsBeforeUpdate.title);
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(new Date(announcementsAfterUpdate.validFromDate!)).toEqual(new Date(announcementsBeforeUpdate.validFromDate!));
      expect(announcementsAfterUpdate.items).toBeDefined();
      expect(Array.isArray(announcementsAfterUpdate.items)).toBe(true);
      expect(announcementsAfterUpdate.items.length).toBe(announcementsBeforeUpdate.items.length);
      expect(announcementsAfterUpdate.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.content.length > 0)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedBy !== undefined)).toBe(true);
      announcementsAfterUpdate.items.forEach((item, index) => {
        expect(updateAnnouncementsModel.items![index].content).toBe(item.content);
        expect(announcementsBeforeUpdate.items[index].content).not.toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('update should change only title', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        title: 'New Title',
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsAfterUpdate, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcementsAfterUpdate).toBeDefined();
      expect(announcementsAfterUpdate.id).toBeDefined();
      expect(isGuid(announcementsAfterUpdate.id)).toBe(true);
      expect(announcementsAfterUpdate.createdBy.length).toBeGreaterThan(0);
      expect(announcementsAfterUpdate.createdAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.createdAt)).toBe(true);
      expect(announcementsAfterUpdate.updatedAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.updatedAt)).toBe(true);
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsAfterUpdate.createdAt);
      // expect(announcementsBeforeUpdate.updatedAt).not.toBe(announcementsAfterUpdate.updatedAt);
      // expect(new Date(announcementsAfterUpdate.updatedAt).getTime()).toBeGreaterThan(new Date(announcementsBeforeUpdate.updatedAt).getTime());
      expect(announcementsAfterUpdate.title).toBe(updateAnnouncementsModel.title);
      expect(announcementsAfterUpdate.title).not.toBe(announcementsBeforeUpdate.title);
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(new Date(announcementsAfterUpdate.validFromDate!)).toEqual(new Date(announcementsBeforeUpdate.validFromDate!));
      expect(announcementsAfterUpdate.items).toBeDefined();
      expect(Array.isArray(announcementsAfterUpdate.items)).toBe(true);
      expect(announcementsAfterUpdate.items.length).toBe(announcementsBeforeUpdate.items.length);
      expect(announcementsAfterUpdate.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.content.length > 0)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedBy === undefined)).toBe(true);
      announcementsBeforeUpdate.items.forEach((item, index) => {
        expect(announcementsAfterUpdate.items[index].content).toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('update with title=null should set title=undefined', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        title: null,
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsAfterUpdate, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcementsAfterUpdate).toBeDefined();
      expect(announcementsAfterUpdate.id).toBeDefined();
      expect(isGuid(announcementsAfterUpdate.id)).toBe(true);
      expect(announcementsAfterUpdate.createdBy.length).toBeGreaterThan(0);
      expect(announcementsAfterUpdate.createdAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.createdAt)).toBe(true);
      expect(announcementsAfterUpdate.updatedAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.updatedAt)).toBe(true);
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsAfterUpdate.createdAt);
      // expect(announcementsBeforeUpdate.updatedAt).not.toBe(announcementsAfterUpdate.updatedAt);
      // expect(new Date(announcementsAfterUpdate.updatedAt).getTime()).toBeGreaterThan(new Date(announcementsBeforeUpdate.updatedAt).getTime());
      expect(announcementsAfterUpdate.title).toBeUndefined();
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(new Date(announcementsAfterUpdate.validFromDate!)).toEqual(new Date(announcementsBeforeUpdate.validFromDate!));
      expect(announcementsAfterUpdate.items).toBeDefined();
      expect(Array.isArray(announcementsAfterUpdate.items)).toBe(true);
      expect(announcementsAfterUpdate.items.length).toBe(announcementsBeforeUpdate.items.length);
      expect(announcementsAfterUpdate.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.content.length > 0)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedBy === undefined)).toBe(true);
      announcementsBeforeUpdate.items.forEach((item, index) => {
        expect(announcementsAfterUpdate.items[index].content).toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('update should change only validFromDate', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        validFromDate: generateRandomDate(),
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsAfterUpdate, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcementsAfterUpdate).toBeDefined();
      expect(announcementsAfterUpdate.id).toBeDefined();
      expect(isGuid(announcementsAfterUpdate.id)).toBe(true);
      expect(announcementsAfterUpdate.createdBy.length).toBeGreaterThan(0);
      expect(announcementsAfterUpdate.createdAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.createdAt)).toBe(true);
      expect(announcementsAfterUpdate.updatedAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.updatedAt)).toBe(true);
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsAfterUpdate.createdAt);
      // expect(announcementsBeforeUpdate.updatedAt).not.toBe(announcementsAfterUpdate.updatedAt);
      // expect(new Date(announcementsAfterUpdate.updatedAt).getTime()).toBeGreaterThan(new Date(announcementsBeforeUpdate.updatedAt).getTime());
      expect(announcementsAfterUpdate.title).toBe(requestData.title);
      expect(announcementsAfterUpdate.title).toBe(announcementsBeforeUpdate.title);
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(new Date(announcementsAfterUpdate.validFromDate!)).toEqual(updateAnnouncementsModel.validFromDate);
      expect(announcementsAfterUpdate.items).toBeDefined();
      expect(Array.isArray(announcementsAfterUpdate.items)).toBe(true);
      expect(announcementsAfterUpdate.items.length).toBe(announcementsAfterUpdate.items.length);
      expect(announcementsAfterUpdate.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.content.length > 0)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedBy === undefined)).toBe(true);
      announcementsAfterUpdate.items.forEach((item, index) => {
        expect(announcementsAfterUpdate.items[index].content).toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('update with validFromDate=null should set validFromDate=null', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        validFromDate: null,
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsAfterUpdate, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcementsAfterUpdate).toBeDefined();
      expect(announcementsAfterUpdate.id).toBeDefined();
      expect(isGuid(announcementsAfterUpdate.id)).toBe(true);
      expect(announcementsAfterUpdate.createdBy.length).toBeGreaterThan(0);
      expect(announcementsAfterUpdate.createdAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.createdAt)).toBe(true);
      expect(announcementsAfterUpdate.updatedAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.updatedAt)).toBe(true);
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsAfterUpdate.createdAt);
      // expect(announcementsBeforeUpdate.updatedAt).not.toBe(announcementsAfterUpdate.updatedAt);
      // expect(new Date(announcementsAfterUpdate.updatedAt).getTime()).toBeGreaterThan(new Date(announcementsBeforeUpdate.updatedAt).getTime());
      expect(announcementsAfterUpdate.title).toBe(requestData.title);
      expect(announcementsAfterUpdate.title).toBe(announcementsBeforeUpdate.title);
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(announcementsAfterUpdate.validFromDate).toBeNull();
      expect(announcementsAfterUpdate.items).toBeDefined();
      expect(Array.isArray(announcementsAfterUpdate.items)).toBe(true);
      expect(announcementsAfterUpdate.items.length).toBe(announcementsBeforeUpdate.items.length);
      expect(announcementsAfterUpdate.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.content.length > 0)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedBy === undefined)).toBe(true);
      announcementsBeforeUpdate.items.forEach((item, index) => {
        expect(announcementsAfterUpdate.items[index].content).toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('update with no data should make no changes', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {};
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsAfterUpdate, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcementsAfterUpdate).toBeDefined();
      expect(announcementsAfterUpdate.id).toBeDefined();
      expect(isGuid(announcementsAfterUpdate.id)).toBe(true);
      expect(announcementsAfterUpdate.createdBy.length).toBeGreaterThan(0);
      expect(announcementsAfterUpdate.createdAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.createdAt)).toBe(true);
      expect(announcementsAfterUpdate.updatedAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.updatedAt)).toBe(true);
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsAfterUpdate.createdAt);
      // expect(announcementsBeforeUpdate.updatedAt).not.toBe(announcementsAfterUpdate.updatedAt);
      // expect(new Date(announcementsAfterUpdate.updatedAt).getTime()).toBeGreaterThan(new Date(announcementsBeforeUpdate.updatedAt).getTime());
      expect(announcementsAfterUpdate.title).toBe(requestData.title);
      expect(announcementsAfterUpdate.title).toBe(announcementsBeforeUpdate.title);
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(new Date(announcementsAfterUpdate.validFromDate!)).toEqual(requestData.validFromDate);
      expect(announcementsAfterUpdate.items).toBeDefined();
      expect(Array.isArray(announcementsAfterUpdate.items)).toBe(true);
      expect(announcementsAfterUpdate.items.length).toBe(announcementsAfterUpdate.items.length);
      expect(announcementsAfterUpdate.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.content.length > 0)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedBy === undefined)).toBe(true);
      announcementsAfterUpdate.items.forEach((item, index) => {
        expect(announcementsAfterUpdate.items[index].content).toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('update with all data set to undefined should make no changes', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await request(app.getServer())
        .post(announcementRoute.path)
        .send(requestData)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        title: undefined,
        validFromDate: undefined,
        items: undefined,
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await request(app.getServer())
        .put(announcementRoute.path + '/' + announcementsId)
        .send(updateAnnouncementsModel)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await request(app.getServer())
        .get(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      expect(getAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsAfterUpdate, message: getMessage }: GetAnnouncementsResponseDto = body;
      expect(getMessage).toBe(events.announcements.announcementsRetrieved);
      expect(announcementsAfterUpdate).toBeDefined();
      expect(announcementsAfterUpdate.id).toBeDefined();
      expect(isGuid(announcementsAfterUpdate.id)).toBe(true);
      expect(announcementsAfterUpdate.createdBy.length).toBeGreaterThan(0);
      expect(announcementsAfterUpdate.createdAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.createdAt)).toBe(true);
      expect(announcementsAfterUpdate.updatedAt).toBeDefined();
      expect(isDateString(announcementsAfterUpdate.updatedAt)).toBe(true);
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsAfterUpdate.createdAt);
      // expect(announcementsBeforeUpdate.updatedAt).not.toBe(announcementsAfterUpdate.updatedAt);
      // expect(new Date(announcementsAfterUpdate.updatedAt).getTime()).toBeGreaterThan(new Date(announcementsBeforeUpdate.updatedAt).getTime());
      expect(announcementsAfterUpdate.title).toBe(requestData.title);
      expect(announcementsAfterUpdate.title).toBe(announcementsBeforeUpdate.title);
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(new Date(announcementsAfterUpdate.validFromDate!)).toEqual(requestData.validFromDate);
      expect(announcementsAfterUpdate.items).toBeDefined();
      expect(Array.isArray(announcementsAfterUpdate.items)).toBe(true);
      expect(announcementsAfterUpdate.items.length).toBe(announcementsAfterUpdate.items.length);
      expect(announcementsAfterUpdate.items.every(item => isGuid(item.id))).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.content.length > 0)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.createdBy !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedAt !== undefined)).toBe(true);
      expect(announcementsAfterUpdate.items.every(item => item.updatedBy === undefined)).toBe(true);
      announcementsAfterUpdate.items.forEach((item, index) => {
        expect(announcementsAfterUpdate.items[index].content).toBe(item.content);
      });

      // cleanup
      const deleteAnnouncementsResponse = await request(app.getServer())
        .delete(announcementRoute.path + '/' + announcementsId)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  // describe('PUT should respond with a status code of 400', () => {
  //   beforeEach(async () => {
  //     jest.resetAllMocks();
  //   });

  //   test('when title is too long', async () => {
  //     const requestData = generateValidAnnouncements();
  //     requestData.title = 'a'.repeat(AnnouncementsTitleMaxLength + 1);

  //     const createAnnouncementsResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createAnnouncementsResponse.statusCode).toBe(400);
  //     const errors = (createAnnouncementsResponse.body.data.message as string)?.split(',');
  //     expect(errors.filter(x => x !== errorKeys.announcements.Title_Too_Long).length).toBe(0);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   test('when item content is too long', async () => {
  //     const requestData = generateValidAnnouncements();
  //     requestData.items![0].content = 'a'.repeat(AnnouncementItemContentMaxLength + 1);

  //     const createAnnouncementsResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createAnnouncementsResponse.statusCode).toBe(400);
  //     const errors = (createAnnouncementsResponse.body.data.message as string)?.split(',');
  //     expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Too_Long).length).toBe(0);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   test('when item content is empty', async () => {
  //     const requestData = generateValidAnnouncements();
  //     requestData.items![0].content = '';

  //     const createAnnouncementsResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createAnnouncementsResponse.statusCode).toBe(400);
  //     const errors = (createAnnouncementsResponse.body.data.message as string)?.split(',');
  //     expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Is_Required).length).toBe(0);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   test('when item content is null', async () => {
  //     const requestData = generateValidAnnouncements();
  //     requestData.items![0].content = null as any;

  //     const createAnnouncementsResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createAnnouncementsResponse.statusCode).toBe(400);
  //     const errors = (createAnnouncementsResponse.body.data.message as string)?.split(',');
  //     expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Is_Required).length).toBe(0);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   test('when item content is undefined', async () => {
  //     const requestData = generateValidAnnouncements();
  //     requestData.items![0].content = undefined as any;

  //     const createAnnouncementsResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createAnnouncementsResponse.statusCode).toBe(400);
  //     const errors = (createAnnouncementsResponse.body.data.message as string)?.split(',');
  //     expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Is_Required).length).toBe(0);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });
  // });

  // describe.each([
  //   new Date('2024-03-24'),
  //   new Date('2024-03-25'),
  //   new Date('2024-03-26'),
  //   new Date('2024-03-27'),

  //   new Date('2024-10-25'),
  //   new Date('2024-10-26'),
  //   new Date('2024-10-27'),
  //   new Date('2024-10-28'),
  // ])('PUT should respond with a status code of 400 for date %o', date => {
  //   beforeEach(async () => {
  //     jest.resetAllMocks();
  //   });

  //   test('when creating many unpublished announcement with same validFromDate', async () => {
  //     const requestData = generateValidAnnouncements();
  //     requestData.validFromDate = date;

  //     let createAnnouncementsResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createAnnouncementsResponse.statusCode).toBe(201);
  //     expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
  //     const body = createAnnouncementsResponse.body;
  //     expect(typeof body).toBe('object');
  //     const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
  //     expect(announcementsId).toBeDefined();

  //     createAnnouncementsResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createAnnouncementsResponse.statusCode).toBe(400);
  //     const errors = (createAnnouncementsResponse.body.data.message as string)?.split(',');
  //     expect(errors.filter(x => x !== errorKeys.announcements.Announcements_With_Given_ValidFromDate_Already_Exists).length).toBe(0);

  //     // cleanup
  //     const deleteAnnouncementsResponse = await request(app.getServer())
  //       .delete(announcementRoute.path + '/' + announcementsId)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(deleteAnnouncementsResponse.statusCode).toBe(200);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers)
  //       .filter(([, eventHandler]) => ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(eventHandler))
  //       .forEach(([, eventHandler]) => {
  //         expect(eventHandler).not.toHaveBeenCalled();
  //       });
  //     expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
  //     expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
  //   });
  // });

  // describe('PUT should respond with a status code of 403', () => {
  //   beforeEach(async () => {
  //     jest.resetAllMocks();
  //   });

  //   test('when token is not set', async () => {
  //     const data = generateValidAnnouncements();
  //     const createAnnouncementsResponse = await request(app.getServer()).post(announcementRoute.path).send(data);
  //     expect(createAnnouncementsResponse.statusCode).toBe(401);
  //     const body = createAnnouncementsResponse.body;
  //     expect(typeof body).toBe('object');
  //     expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   test('when user has no permission', async () => {
  //     const userData = generateValidUser();
  //     const newUserResponse = await request(app.getServer()).post(userRoute.path).send(userData).set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(newUserResponse.statusCode).toBe(201);
  //     let body = newUserResponse.body;
  //     expect(typeof body).toBe('object');
  //     const { data: user, message: createMessage }: CreateUserResponseDto = body;
  //     expect(user?.id).toBeDefined();
  //     expect(user?.email).toBeDefined();
  //     expect(createMessage).toBe(events.users.userCreated);

  //     const activateNewUserResponse = await request(app.getServer())
  //       .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(activateNewUserResponse.statusCode).toBe(200);

  //     const newUserAccessToken = (await loginAs(app, { email: userData.email, password: userData.password } satisfies LoginDto))?.accessToken;

  //     const createAnnouncementsResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(generateValidAnnouncements())
  //       .set('Authorization', `Bearer ${newUserAccessToken}`);
  //     expect(createAnnouncementsResponse.statusCode).toBe(403);
  //     expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
  //     body = createAnnouncementsResponse.body;
  //     expect(typeof body).toBe('object');
  //     expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

  //     const deleteUserResponse = await request(app.getServer())
  //       .delete(userRoute.path + '/' + user.id)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(deleteUserResponse.statusCode).toBe(200);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers)
  //       .filter(
  //         ([, eventHandler]) =>
  //           ![
  //             testEventHandlers.onUserCreated,
  //             testEventHandlers.onUserActivated,
  //             testEventHandlers.onUserLoggedIn,
  //             testEventHandlers.onUserDeleted,
  //           ].includes(eventHandler),
  //       )
  //       .forEach(([, eventHandler]) => {
  //         expect(eventHandler).not.toHaveBeenCalled();
  //       });
  //     expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
  //     expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
  //     expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
  //     expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
  //   });

  //   test('when user have all permissions expect AddAnnouncements', async () => {
  //     const userData = generateValidUser();
  //     const newUserResponse = await request(app.getServer()).post(userRoute.path).send(userData).set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(newUserResponse.statusCode).toBe(201);
  //     let body = newUserResponse.body;
  //     expect(typeof body).toBe('object');
  //     const { data: user, message: createMessage }: CreateUserResponseDto = body;
  //     expect(user?.id).toBeDefined();
  //     expect(user?.email).toBeDefined();
  //     expect(createMessage).toBe(events.users.userCreated);

  //     const activateNewUserResponse = await request(app.getServer())
  //       .post(userRoute.path + '/' + user.id + '/' + userRoute.activatePath)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(activateNewUserResponse.statusCode).toBe(200);

  //     const systemPermissions = Object.values(SystemPermission);
  //     systemPermissions.forEach(async permission => {
  //       if (isNumber(permission)) {
  //         const value = permission as number;
  //         if (value !== SystemPermission.AddAnnouncements) {
  //           const path = permissionsRoute.path + '/' + user.id + '/' + permission.toString();
  //           const addPermissionResponse = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAccessToken}`);
  //           expect(addPermissionResponse.statusCode).toBe(201);
  //         }
  //       }
  //     });

  //     const newUserAccessToken = (await loginAs(app, { email: userData.email, password: userData.password } satisfies LoginDto))?.accessToken;

  //     const createAnnouncementsResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(generateValidAnnouncements())
  //       .set('Authorization', `Bearer ${newUserAccessToken}`);
  //     expect(createAnnouncementsResponse.statusCode).toBe(403);
  //     expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
  //     body = createAnnouncementsResponse.body;
  //     expect(typeof body).toBe('object');
  //     expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

  //     const deleteUserResponse = await request(app.getServer())
  //       .delete(userRoute.path + '/' + user.id)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(deleteUserResponse.statusCode).toBe(200);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers)
  //       .filter(
  //         ([, eventHandler]) =>
  //           ![
  //             testEventHandlers.onUserCreated,
  //             testEventHandlers.onUserActivated,
  //             testEventHandlers.onUserLoggedIn,
  //             testEventHandlers.onUserDeleted,
  //             testEventHandlers.onPermissionAdded,
  //           ].includes(eventHandler),
  //       )
  //       .forEach(([, eventHandler]) => {
  //         expect(eventHandler).not.toHaveBeenCalled();
  //       });
  //     expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
  //     expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
  //     expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
  //     expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
  //     expect(testEventHandlers.onPermissionAdded).toHaveBeenCalled();
  //   });
  // });

  // describe('PUT should respond with a status code of 401', () => {
  //   beforeEach(async () => {
  //     jest.resetAllMocks();
  //   });

  //   test('when token is invalid', async () => {
  //     const requestData = generateValidAnnouncements();
  //     const response = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(requestData)
  //       .set('Authorization', `Bearer invalid_token_${adminAccessToken}`);
  //     expect(response.statusCode).toBe(401);
  //     const body = response.body;
  //     expect(typeof body).toBe('object');
  //     expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
  //       expect(eventHandler).not.toHaveBeenCalled();
  //     });
  //   });

  //   test('when try to use token from user that not exists', async () => {
  //     const userBob = generateValidUser();

  //     const createBobResponse = await request(app.getServer()).post(userRoute.path).send(userBob).set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(createBobResponse.statusCode).toBe(201);
  //     const { data: bobDto, message: bobCreateMessage }: CreateUserResponseDto = createBobResponse.body;
  //     expect(bobDto?.id).toBeDefined();
  //     expect(bobCreateMessage).toBe(events.users.userCreated);

  //     const activateBobResponse = await request(app.getServer())
  //       .post(userRoute.path + '/' + bobDto.id + '/' + userRoute.activatePath)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(activateBobResponse.statusCode).toBe(200);

  //     const bobAccessToken = (await loginAs(app, { email: bobDto.email, password: userBob.password } satisfies LoginDto))?.accessToken;

  //     const deleteBobResponse = await request(app.getServer())
  //       .delete(userRoute.path + '/' + bobDto.id)
  //       .send()
  //       .set('Authorization', `Bearer ${adminAccessToken}`);
  //     expect(deleteBobResponse.statusCode).toBe(200);

  //     const createAnnouncementsUsingBobAccessTokenResponse = await request(app.getServer())
  //       .post(announcementRoute.path)
  //       .send(generateValidAnnouncements())
  //       .set('Authorization', `Bearer ${bobAccessToken}`);
  //     expect(createAnnouncementsUsingBobAccessTokenResponse.statusCode).toBe(401);
  //     expect(createAnnouncementsUsingBobAccessTokenResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
  //     const body = createAnnouncementsUsingBobAccessTokenResponse.body;
  //     expect(typeof body).toBe('object');
  //     const data = body.data;
  //     const { message: loginMessage, args: loginArgs }: { message: string; args: string[] } = data;
  //     expect(loginMessage).toBe(errorKeys.login.Wrong_Authentication_Token);
  //     expect(loginArgs).toBeUndefined();

  //     // checking events running via eventDispatcher
  //     Object.entries(testEventHandlers)
  //       .filter(
  //         ([, eventHandler]) =>
  //           ![
  //             testEventHandlers.onUserCreated,
  //             testEventHandlers.onUserActivated,
  //             testEventHandlers.onUserLoggedIn,
  //             testEventHandlers.onUserDeleted,
  //           ].includes(eventHandler),
  //       )
  //       .forEach(([, eventHandler]) => {
  //         expect(eventHandler).not.toHaveBeenCalled();
  //       });
  //     expect(testEventHandlers.onUserCreated).toHaveBeenCalled();
  //     expect(testEventHandlers.onUserActivated).toHaveBeenCalled();
  //     expect(testEventHandlers.onUserLoggedIn).toHaveBeenCalled();
  //     expect(testEventHandlers.onUserDeleted).toHaveBeenCalled();
  //   });
  // });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
