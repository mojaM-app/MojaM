import { VALIDATOR_SETTINGS } from '@config';
import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto, userTestHelpers } from '@modules/users';
import { generateRandomDate, getAdminLoginData, isGuid } from '@utils';
import { isDateString } from 'class-validator';
import { Guid } from 'guid-typescript';
import { generateValidAnnouncements } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateAnnouncementsResponseDto } from '../dtos/create-announcements.dto';
import { GetAnnouncementsResponseDto } from '../dtos/get-announcements.dto';
import { UpdateAnnouncementsDto, UpdateAnnouncementsResponseDto } from '../dtos/update-announcements.dto';
import { AnnouncementStateValue } from '../enums/announcement-state.enum';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('PUT /announcements', () => {
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

  describe('PUT should respond with a status code of 200 when data are valid and user has permission', () => {
    test('update should add new item', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: announcementsBeforeUpdate.items.map(item => {
          return { id: item.id, content: item.content };
        }),
      };
      updateAnnouncementsModel.items!.push({ id: '', content: 'new item' });
      expect(updateAnnouncementsModel.title).toBeUndefined();
      expect(updateAnnouncementsModel.validFromDate).toBeUndefined();
      announcementsBeforeUpdate.items.forEach((item, index) => {
        expect(updateAnnouncementsModel.items![index].content).toBe(item.content);
      });
      expect(announcementsBeforeUpdate.items.length).toBeLessThan(updateAnnouncementsModel.items!.length);

      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      expect(announcementsAfterUpdate.title).toBe(announcementsBeforeUpdate.title);
      expect(announcementsAfterUpdate.state).toBe(AnnouncementStateValue.DRAFT);
      expect(announcementsAfterUpdate.publishedAt).toBeUndefined();
      expect(announcementsAfterUpdate.publishedBy).toBeUndefined();
      expect(new Date(announcementsAfterUpdate.validFromDate!).toDateString()).toEqual(
        new Date(announcementsBeforeUpdate.validFromDate!).toDateString(),
      );
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
      });

      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: announcementsBeforeUpdate.items.splice(-1).map((item, index) => ({
          id: item.id,
          content: `${index + 1}_New_Content_${item.id}`,
        })),
      };
      expect(updateAnnouncementsModel.title).toBeUndefined();
      expect(updateAnnouncementsModel.validFromDate).toBeUndefined();
      updateAnnouncementsModel.items!.forEach((item, index) => {
        expect(announcementsBeforeUpdate.items[index].content).not.toBe(item.content);
      });
      expect(announcementsBeforeUpdate.items.length).toBeGreaterThan(updateAnnouncementsModel.items!.length);

      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      expect(new Date(announcementsAfterUpdate.validFromDate!).toDateString()).toEqual(
        new Date(announcementsBeforeUpdate.validFromDate!).toDateString(),
      );
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
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: announcementsBeforeUpdate.items.map((item, index) => ({
          id: item.id,
          content: `${index + 1}_New_Content_${item.id}`,
        })),
      };
      expect(updateAnnouncementsModel.title).toBeUndefined();
      expect(updateAnnouncementsModel.validFromDate).toBeUndefined();
      announcementsBeforeUpdate.items.forEach((item, index) => {
        expect(updateAnnouncementsModel.items![index].content).not.toBe(item.content);
      });

      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      expect(new Date(announcementsAfterUpdate.validFromDate!).toDateString()).toEqual(
        new Date(announcementsBeforeUpdate.validFromDate!).toDateString(),
      );
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
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        title: 'New Title',
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      expect(new Date(announcementsAfterUpdate.validFromDate!).toDateString()).toEqual(
        new Date(announcementsBeforeUpdate.validFromDate!).toDateString(),
      );
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
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        title: null,
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      expect(new Date(announcementsAfterUpdate.validFromDate!).toDateString()).toEqual(
        new Date(announcementsBeforeUpdate.validFromDate!).toDateString(),
      );
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
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        validFromDate: generateRandomDate(),
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      expect(new Date(announcementsAfterUpdate.validFromDate!).toDateString()).toEqual(
        updateAnnouncementsModel.validFromDate!.toDateString(),
      );
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
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        validFromDate: null,
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      body = getAnnouncementsResponse.body;
      const { data: announcementsBeforeUpdate }: GetAnnouncementsResponseDto = body;
      expect(announcementsBeforeUpdate.createdAt).toBe(announcementsBeforeUpdate.updatedAt);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {};
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      expect(new Date(announcementsAfterUpdate.validFromDate!).toDateString()).toEqual(
        requestData.validFromDate!.toDateString(),
      );
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
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId, message: createMessage }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();
      expect(createMessage).toBe(events.announcements.announcementsCreated);

      let getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: updatedAnnouncementsId, message: updateMessage }: UpdateAnnouncementsResponseDto = body;
      expect(updatedAnnouncementsId).toBeDefined();
      expect(updateMessage).toBe(events.announcements.announcementsUpdated);
      expect(updatedAnnouncementsId).toBe(announcementsId);

      getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
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
      expect(new Date(announcementsAfterUpdate.validFromDate!).toDateString()).toEqual(
        requestData.validFromDate!.toDateString(),
      );
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
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
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

    test('when try to update published announcements without changing validFromDate', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const publishAnnouncementsResponse = await app!.announcements.publish(announcementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        title: null,
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(200);

      const getAnnouncementsResponse = await app!.announcements.get(announcementsId, adminAccessToken);
      expect(getAnnouncementsResponse.statusCode).toBe(200);
      const { data: announcements }: GetAnnouncementsResponseDto = getAnnouncementsResponse.body;
      expect(announcements.title).toBeUndefined();
      expect(new Date(announcements.validFromDate!).toDateString()).toBe(requestData.validFromDate!.toDateString());

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onAnnouncementsCreated,
              testEventHandlers.onAnnouncementsPublished,
              testEventHandlers.onAnnouncementsUpdated,
              testEventHandlers.onAnnouncementsRetrieved,
              testEventHandlers.onAnnouncementsDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsUpdated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('PUT should respond with a status code of 400', () => {
    test('when title is too long', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        title: 'a'.repeat(VALIDATOR_SETTINGS.ANNOUNCEMENTS_TITLE_MAX_LENGTH + 1),
      };
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(400);
      const data = updateAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Title_Too_Long).length).toBe(0);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(
              eventHandler,
            ),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('when item content is too long', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: [
          {
            content: 'a'.repeat(VALIDATOR_SETTINGS.ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH + 1),
          },
        ],
      };

      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(400);
      const data = updateAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Too_Long).length).toBe(0);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(
              eventHandler,
            ),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('when item content is empty', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: [
          {
            content: '',
          },
        ],
      };

      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(400);
      const data = updateAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Is_Required).length).toBe(0);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(
              eventHandler,
            ),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('when item content is null', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: [
          {
            content: null as any,
          },
        ],
      };

      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(400);
      const data = updateAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Is_Required).length).toBe(0);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(
              eventHandler,
            ),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('when item content is undefined', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        items: [
          {
            content: undefined as any,
          },
        ],
      };

      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(400);
      const data = updateAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Item_Content_Is_Required).length).toBe(0);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(
              eventHandler,
            ),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('when validFromDate is the same as another announcements validFromDate', async () => {
      let requestData = generateValidAnnouncements();
      const d1 = requestData.validFromDate;
      let createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements1Id }: CreateAnnouncementsResponseDto = body;
      expect(announcements1Id).toBeDefined();

      requestData = generateValidAnnouncements();
      createAnnouncementsResponse = await app!.announcements.create(
        {
          ...requestData,
          validFromDate: d1!.addDays(1),
        },
        adminAccessToken,
      );
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcements2Id }: CreateAnnouncementsResponseDto = body;
      expect(announcements2Id).toBeDefined();

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        validFromDate: d1,
      };
      expect(requestData.title).not.toBe(updateAnnouncementsModel.title);
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      expect(updateAnnouncementsModel.validFromDate).toBe(d1);
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcements2Id,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(400);
      const data = updateAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(
        errors.filter(x => x !== errorKeys.announcements.Announcements_With_Given_ValidFromDate_Already_Exists).length,
      ).toBe(0);

      // cleanup
      let deleteAnnouncementsResponse = await app!.announcements.delete(announcements1Id, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      deleteAnnouncementsResponse = await app!.announcements.delete(announcements2Id, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(
              eventHandler,
            ),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(2);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(2);
    });

    test('when update announcements that not exists', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        validFromDate: generateRandomDate(),
      };
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(400);
      const data = updateAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Announcements_Does_Not_Exist).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onAnnouncementsCreated, testEventHandlers.onAnnouncementsDeleted].includes(
              eventHandler,
            ),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('when try to remove validFromDate at published announcements', async () => {
      const requestData = generateValidAnnouncements();
      const createAnnouncementsResponse = await app!.announcements.create(requestData, adminAccessToken);
      expect(createAnnouncementsResponse.statusCode).toBe(201);
      expect(createAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      const { data: announcementsId }: CreateAnnouncementsResponseDto = body;
      expect(announcementsId).toBeDefined();

      const publishAnnouncementsResponse = await app!.announcements.publish(announcementsId, adminAccessToken);
      expect(publishAnnouncementsResponse.statusCode).toBe(200);

      const updateAnnouncementsModel: UpdateAnnouncementsDto = {
        validFromDate: null,
      };
      expect(requestData.validFromDate).not.toBe(updateAnnouncementsModel.validFromDate);
      const updateAnnouncementsResponse = await app!.announcements.update(
        announcementsId,
        updateAnnouncementsModel,
        adminAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(400);
      const data = updateAnnouncementsResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(
        errors.filter(x => x !== errorKeys.announcements.Cannot_Save_Published_Announcements_Without_ValidFromDate)
          .length,
      ).toBe(0);

      // cleanup
      const deleteAnnouncementsResponse = await app!.announcements.delete(announcementsId, adminAccessToken);
      expect(deleteAnnouncementsResponse.statusCode).toBe(200);

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
      expect(testEventHandlers.onAnnouncementsCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsPublished).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onAnnouncementsDeleted).toHaveBeenCalledTimes(1);
    });

    test('when announcements Id looks like a valid guid but it is not', async () => {
      const nonExistentId = '99999999-9999-9999-9999-999999999999';
      const updateData = generateValidAnnouncements();
      const updateResponse = await app!.announcements.update(nonExistentId, updateData, adminAccessToken);
      expect(updateResponse.statusCode).toBe(400);
      const data = updateResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.announcements.Announcements_Does_Not_Exist).length).toBe(0);
    });
  });

  describe('PUT should respond with a status code of 403', () => {
    test('when token is not set', async () => {
      const data = generateValidAnnouncements();
      const updateAnnouncementsResponse = await app!.announcements.update(Guid.EMPTY, data);
      expect(updateAnnouncementsResponse.statusCode).toBe(401);
      const body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when user has no permission', async () => {
      const userData = userTestHelpers.generateValidUserWithPassword();
      const newUserResponse = await app!.user.create(userData, adminAccessToken);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: userData.email, passcode: userData.passcode } satisfies ILoginModel)
      )?.accessToken;

      const updateAnnouncementsResponse = await app!.announcements.update(
        Guid.EMPTY,
        generateValidAnnouncements(),
        newUserAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(403);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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

    test('when user have all permissions expect EditAnnouncements', async () => {
      const userData = userTestHelpers.generateValidUserWithPassword();
      const newUserResponse = await app!.user.create(userData, adminAccessToken);
      expect(newUserResponse.statusCode).toBe(201);
      let body = newUserResponse.body;
      expect(typeof body).toBe('object');
      const { data: user, message: createMessage }: CreateUserResponseDto = body;
      expect(user?.id).toBeDefined();
      expect(user?.email).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const activateNewUserResponse = await app!.user.activate(user.id, adminAccessToken);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const addPermissionsResponse = await app!.permissions.addAllPermissionsToUser(user.id, adminAccessToken, [
        SystemPermissions.EditAnnouncements,
      ]);
      expect(addPermissionsResponse!.statusCode).toBe(201);

      const newUserAccessToken = (
        await app!.auth.loginAs({ email: userData.email, passcode: userData.passcode } satisfies ILoginModel)
      )?.accessToken;

      const updateAnnouncementsResponse = await app!.announcements.update(
        Guid.EMPTY,
        generateValidAnnouncements(),
        newUserAccessToken,
      );
      expect(updateAnnouncementsResponse.statusCode).toBe(403);
      expect(updateAnnouncementsResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = updateAnnouncementsResponse.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authorized);

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

  describe('PUT should respond with a status code of 401', () => {
    test('when token is invalid', async () => {
      const requestData = generateValidAnnouncements();
      const response = await app!.announcements.update(Guid.EMPTY, requestData, `invalid_token_${adminAccessToken}`);
      expect(response.statusCode).toBe(401);
      const body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe(errorKeys.login.User_Not_Authenticated);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when try to use token from user that not exists', async () => {
      const userBob = userTestHelpers.generateValidUserWithPassword();
      const createBobResponse = await app!.user.create(userBob, adminAccessToken);
      expect(createBobResponse.statusCode).toBe(201);
      const { data: bobDto, message: bobCreateMessage }: CreateUserResponseDto = createBobResponse.body;
      expect(bobDto?.id).toBeDefined();
      expect(bobCreateMessage).toBe(events.users.userCreated);

      const activateBobResponse = await app!.user.activate(bobDto.id, adminAccessToken);
      expect(activateBobResponse.statusCode).toBe(200);

      const bobAccessToken = (
        await app!.auth.loginAs({ email: bobDto.email, passcode: userBob.passcode } satisfies ILoginModel)
      )?.accessToken;

      const deleteBobResponse = await app!.user.delete(bobDto.id, adminAccessToken);
      expect(deleteBobResponse.statusCode).toBe(200);

      const updateAnnouncementsUsingBobAccessTokenResponse = await app!.announcements.update(
        Guid.EMPTY,
        generateValidAnnouncements(),
        bobAccessToken,
      );
      expect(updateAnnouncementsUsingBobAccessTokenResponse.statusCode).toBe(401);
      expect(updateAnnouncementsUsingBobAccessTokenResponse.headers['content-type']).toEqual(
        expect.stringContaining('json'),
      );
      const body = updateAnnouncementsUsingBobAccessTokenResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as UnauthorizedException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Wrong_Authentication_Token);
      expect(loginArgs).toBeUndefined();

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
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
