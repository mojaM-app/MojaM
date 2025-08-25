import { VALIDATOR_SETTINGS } from '@config';
import { events, ILoginModel, SystemPermissions } from '@core';
import { BadRequestException, errorKeys, UnauthorizedException } from '@exceptions';
import { testHelpers } from '@helpers';
import { CreateUserResponseDto } from '@modules/users';
import { generateValidUserWithPassword } from '@modules/users/tests/test.helpers';
import { getAdminLoginData, isGuid } from '@utils';
import { isDateString } from 'class-validator';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';
import { GetBulletinResponseDto } from '../dtos/get-bulletin.dto';
import { BulletinState } from '../enums/bulletin-state.enum';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('POST /bulletins', () => {
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

  describe('POST should respond with a status code of 201 when data are valid and user has permission', () => {
    test('create unpublished bulletin', async () => {
      const requestData = generateValidBulletin();
      requestData.title = 'a'.repeat(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH);

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createBulletinResponse.body;
      expect(typeof body).toBe('object');
      const { data: bulletinId, message: createMessage }: CreateBulletinResponseDto = body;
      expect(bulletinId).toBeDefined();
      expect(createMessage).toBe(events.bulletin.bulletinCreated);

      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      expect(getBulletinResponse.statusCode).toBe(200);
      expect(getBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getBulletinResponse.body;
      expect(typeof body).toBe('object');
      const { data: bulletin, message: getMessage }: GetBulletinResponseDto = body;
      expect(getMessage).toBe(events.bulletin.bulletinRetrieved);
      expect(bulletin).toBeDefined();
      expect(bulletin.id).toBeDefined();
      expect(isGuid(bulletin.id)).toBe(true);
      expect(bulletin.createdBy.length).toBeGreaterThan(0);
      expect(bulletin.createdAt).toBeDefined();
      expect(isDateString(bulletin.createdAt)).toBe(true);
      expect(bulletin.updatedAt).toBeDefined();
      expect(isDateString(bulletin.updatedAt)).toBe(true);
      expect(bulletin.createdAt).toBe(bulletin.updatedAt);
      expect(bulletin.title).toBe(requestData.title);
      expect(bulletin.state).toBe(BulletinState.Draft);
      expect(bulletin.number).toBe(requestData.number);
      expect(bulletin.introduction).toBe(requestData.introduction);
      expect(bulletin.tipsForWork).toBe(requestData.tipsForWork);
      expect(bulletin.dailyPrayer).toBe(requestData.dailyPrayer);
      expect(bulletin.publishedAt).toBeNull();
      expect(bulletin.publishedBy).toBeNull();
      expect(new Date(bulletin.date!).toDateString()).toEqual(new Date(requestData.date!).toDateString());

      expect(bulletin.days).toBeDefined();
      expect(Array.isArray(bulletin.days)).toBe(true);
      expect(bulletin.days.length).toBe(requestData.days?.length || 0);

      bulletin.days.forEach((day, dayIndex) => {
        const requestDay = requestData.days![dayIndex];
        expect(day.id).toBeDefined();
        expect(isGuid(day.id)).toBe(true);
        expect(day.title).toBe(requestDay.title);
        expect(new Date(day.date!).toDateString()).toEqual(new Date(requestDay.date).toDateString());

        expect(day.sections).toBeDefined();
        expect(Array.isArray(day.sections)).toBe(true);
        expect(day.sections.length).toBe(requestDay.sections.length);

        day.sections.forEach((section, sectionIndex) => {
          const requestSection = requestDay.sections[sectionIndex];
          expect(section.id).toBeDefined();
          expect(isGuid(section.id)).toBe(true);
          expect(section.order).toBe(requestSection.order);
          expect(section.type).toBe(requestSection.type);
          expect(section.title).toBe(requestSection.title);
          expect(section.content).toBe(requestSection.content);
        });
      });

      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onBulletinCreated,
              testEventHandlers.onBulletinRetrieved,
              testEventHandlers.onBulletinDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });

    test('create bulletin with no days', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      let body = createBulletinResponse.body;
      expect(typeof body).toBe('object');
      const { data: bulletinId, message: createMessage }: CreateBulletinResponseDto = body;
      expect(bulletinId).toBeDefined();
      expect(createMessage).toBe(events.bulletin.bulletinCreated);

      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      expect(getBulletinResponse.statusCode).toBe(200);
      expect(getBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      body = getBulletinResponse.body;
      expect(typeof body).toBe('object');
      const { data: bulletin, message: getMessage }: GetBulletinResponseDto = body;
      expect(getMessage).toBe(events.bulletin.bulletinRetrieved);
      expect(bulletin).toBeDefined();
      expect(bulletin.id).toBeDefined();
      expect(isGuid(bulletin.id)).toBe(true);
      expect(bulletin.createdBy.length).toBeGreaterThan(0);
      expect(bulletin.createdAt).toBeDefined();
      expect(isDateString(bulletin.createdAt)).toBe(true);
      expect(bulletin.updatedAt).toBeDefined();
      expect(isDateString(bulletin.updatedAt)).toBe(true);
      expect(bulletin.createdAt).toBe(bulletin.updatedAt);
      expect(bulletin.title).toBe(requestData.title);
      expect(bulletin.state).toBe(BulletinState.Draft);
      expect(bulletin.number).toBe(requestData.number);
      expect(bulletin.introduction).toBe(requestData.introduction);
      expect(bulletin.tipsForWork).toBe(requestData.tipsForWork);
      expect(bulletin.dailyPrayer).toBe(requestData.dailyPrayer);
      expect(bulletin.publishedAt).toBeNull();
      expect(bulletin.publishedBy).toBeNull();
      expect(new Date(bulletin.date!).toDateString()).toEqual(new Date(requestData.date!).toDateString());

      expect(bulletin.days).toBeDefined();
      expect(Array.isArray(bulletin.days)).toBe(true);
      expect(bulletin.days.length).toBe(requestData.days?.length || 0);

      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![
              testEventHandlers.onBulletinCreated,
              testEventHandlers.onBulletinRetrieved,
              testEventHandlers.onBulletinDeleted,
            ].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinRetrieved).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST should respond with a status code of 400', () => {
    test('when title is too long', async () => {
      const requestData = generateValidBulletin();
      requestData.title = 'a'.repeat(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH + 1);

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.bulletin.Title_Too_Long).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when title is not a string', async () => {
      const requestData = generateValidBulletin();
      requestData.title = 123 as any;
      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x === errorKeys.bulletin.Title_Must_Be_A_String).length).toBe(1);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when title is empty', async () => {
      const requestData = generateValidBulletin();
      requestData.title = '';

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.bulletin.Title_Is_Required).length).toBe(0);
    });

    test('when title is null', async () => {
      const requestData = generateValidBulletin();
      requestData.title = null;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x === errorKeys.bulletin.Title_Is_Required).length).toBe(1);
    });

    test('when title is not set', async () => {
      const requestData = generateValidBulletin();
      delete requestData.title;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x === errorKeys.bulletin.Title_Is_Required).length).toBe(1);
    });

    test('when date is null', async () => {
      const requestData = generateValidBulletin();
      requestData.date = null;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.bulletin.Date_Is_Required).length).toBe(0);
    });

    test('when date is not set', async () => {
      const requestData = generateValidBulletin();
      delete requestData.date;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.bulletin.Date_Is_Required).length).toBe(0);
    });

    test('when number is null', async () => {
      const requestData = generateValidBulletin();
      requestData.number = null;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x === errorKeys.bulletin.Number_Is_Required).length).toBe(1);
    });

    test('when number is not set', async () => {
      const requestData = generateValidBulletin();
      delete requestData.number;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x === errorKeys.bulletin.Number_Is_Required).length).toBe(1);
    });

    test('when number is 0', async () => {
      const requestData = generateValidBulletin();
      requestData.number = 0;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.bulletin.Min_Number_Greater_Than_Zero).length).toBe(0);
    });

    test('when number is negative', async () => {
      const requestData = generateValidBulletin();
      requestData.number = -1;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.bulletin.Min_Number_Greater_Than_Zero).length).toBe(0);
    });

    test('when number is greater than max', async () => {
      const requestData = generateValidBulletin();
      requestData.number = Number.MAX_SAFE_INTEGER + 1;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => !x.startsWith('number must not be greater than')).length).toBe(0);
    });

    test('when section content is too long', async () => {
      const requestData = generateValidBulletin();
      requestData.days![0].sections[0].content = 'a'.repeat(
        VALIDATOR_SETTINGS.BULLETIN_DAY_SECTION_CONTENT_MAX_LENGTH + 1,
      );

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.bulletin.Section_Content_Too_Long).length).toBe(0);
    });

    test('when creating a bulletin with a date that already exists', async () => {
      const data1 = generateValidBulletin();
      const res1 = await app!.bulletin.create(data1, adminAccessToken);
      expect(res1.statusCode).toBe(201);
      const { data: id1 }: CreateBulletinResponseDto = res1.body;

      const data2 = generateValidBulletin();
      // Force the same date to trigger duplicate check
      data2.date = data1.date;
      const res2 = await app!.bulletin.create(data2, adminAccessToken);
      expect(res2.statusCode).toBe(400);
      const body = res2.body;
      const message = (body.data?.message ?? body.message) as string | string[] | undefined;
      if (Array.isArray(message)) {
        expect(message).toContain(errorKeys.bulletin.Bulletin_With_Given_Date_Already_Exists);
      } else {
        expect(String(message)).toEqual(
          expect.stringContaining(errorKeys.bulletin.Bulletin_With_Given_Date_Already_Exists),
        );
      }

      // cleanup
      await app!.bulletin.delete(id1, adminAccessToken);
    });
  });

  describe('POST should respond with a status code of 403', () => {
    test('when user has no permission', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);
      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;

      const requestData = generateValidBulletin();
      const createBulletinResponse = await app!.bulletin.create(requestData, userAccessToken);
      expect(createBulletinResponse.statusCode).toBe(403);

      await app!.user.delete(createdUser.id, adminAccessToken);
    });

    test('when user have all permissions expect AddBulletin', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);

      const requestData = generateValidBulletin();
      const allPermissionsExceptAddBulletin = Object.values(SystemPermissions).filter(
        permission => permission !== SystemPermissions.AddBulletin,
      );

      for (const permission of allPermissionsExceptAddBulletin) {
        await app!.permissions.add(createdUser.id, permission, adminAccessToken);
      }

      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;

      const createBulletinResponse = await app!.bulletin.create(requestData, userAccessToken);
      expect(createBulletinResponse.statusCode).toBe(403);

      await app!.user.delete(createdUser.id, adminAccessToken);
    });
  });

  describe('POST should respond with a status code of 401', () => {
    test('when token is not set', async () => {
      const requestData = generateValidBulletin();
      const createBulletinResponse = await app!.bulletin.create(requestData);
      expect(createBulletinResponse.statusCode).toBe(401);
    });

    test('when token is invalid', async () => {
      const requestData = generateValidBulletin();
      const createBulletinResponse = await app!.bulletin.create(requestData, 'invalid_token');
      expect(createBulletinResponse.statusCode).toBe(401);
    });

    test('when try to use token from user that not exists', async () => {
      const newUser = generateValidUserWithPassword();
      const createUserResponse = await app!.user.create(newUser, adminAccessToken);
      expect(createUserResponse.statusCode).toBe(201);
      const { data: createdUser }: CreateUserResponseDto = createUserResponse.body;
      await app!.user.activate(createdUser.id, adminAccessToken);
      const loginResponse = await app!.auth.loginAs({ email: newUser.email, passcode: newUser.passcode });
      const userAccessToken = loginResponse?.accessToken;
      await app!.user.delete(createdUser.id, adminAccessToken);

      const requestData = generateValidBulletin();
      const createBulletinResponse = await app!.bulletin.create(requestData, userAccessToken);
      expect(createBulletinResponse.statusCode).toBe(401);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = createBulletinResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data as UnauthorizedException;
      const { message: loginMessage, args: loginArgs } = data;
      expect(loginMessage).toBe(errorKeys.login.Wrong_Authentication_Token);
      expect(loginArgs).toBeUndefined();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
