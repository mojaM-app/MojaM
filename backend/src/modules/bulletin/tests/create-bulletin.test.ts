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
import {
  CreateBulletinDayDto,
  CreateBulletinDaySectionDto,
  CreateBulletinDto,
  CreateBulletinResponseDto,
} from '../dtos/create-bulletin.dto';
import { GetBulletinResponseDto } from '../dtos/get-bulletin.dto';
import { BulletinSectionSettingsDto } from '../dtos/settings.dto';
import { SectionType } from '../enums/bulletin-section-type.enum';
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
      expect(bulletin.createdBy!.length).toBeGreaterThan(0);
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
      expect(bulletin!.date).toBe(requestData.date!.toISOString());

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
      expect(bulletin.createdBy!.length).toBeGreaterThan(0);
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
      expect(bulletin!.date).toBe(requestData.date!.toISOString());

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

    test('create bulletin with multiple days and different section types', async () => {
      const requestData = generateValidBulletin();
      const baseDate = new Date();

      // Test różnych typów sekcji
      requestData.days = [
        {
          date: baseDate,
          title: 'Day with Introduction',
          sections: [
            {
              order: 1,
              type: SectionType.INTRODUCTION,
              title: null, // INTRODUCTION nie może mieć title
              content: null, // INTRODUCTION nie może mieć content
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
            {
              order: 2,
              type: SectionType.CUSTOM_TEXT,
              title: 'Custom Section',
              content: 'Custom content text',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
        {
          date: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000), // +1 dzień
          title: 'Day with Tips and Prayer',
          sections: [
            {
              order: 1,
              type: SectionType.TIPS_FOR_WORK,
              title: null,
              content: null,
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
            {
              order: 2,
              type: SectionType.DAILY_PRAYER,
              title: null,
              content: null,
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;

      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      expect(getBulletinResponse.statusCode).toBe(200);
      const { data: bulletin }: GetBulletinResponseDto = getBulletinResponse.body;

      expect(bulletin.days.length).toBe(2);
      expect(bulletin.days[0].sections.length).toBe(2);
      expect(bulletin.days[1].sections.length).toBe(2);

      // Sprawdzenie typów sekcji
      expect(bulletin.days[0].sections[0].type).toBe(SectionType.INTRODUCTION);
      expect(bulletin.days[0].sections[1].type).toBe(SectionType.CUSTOM_TEXT);
      expect(bulletin.days[1].sections[0].type).toBe(SectionType.TIPS_FOR_WORK);
      expect(bulletin.days[1].sections[1].type).toBe(SectionType.DAILY_PRAYER);

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

    test('create bulletin with minimum required fields', async () => {
      const requestData = {
        title: 'Minimum Title',
        date: new Date(),
        number: 1,
        introduction: null,
        tipsForWork: null,
        dailyPrayer: null,
        days: [],
      };

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;

      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      expect(getBulletinResponse.statusCode).toBe(200);
      const { data: bulletin }: GetBulletinResponseDto = getBulletinResponse.body;

      expect(bulletin.title).toBe(requestData.title);
      expect(bulletin.number).toBe(requestData.number);
      expect(bulletin.introduction).toBeNull();
      expect(bulletin.tipsForWork).toBeNull();
      expect(bulletin.dailyPrayer).toBeNull();
      expect(bulletin.days.length).toBe(0);

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

    test('create bulletin with maximum field lengths', async () => {
      const requestData = {
        title: 'x'.repeat(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH),
        date: new Date(),
        number: 999999, // Maksymalna praktyczna wartość
        introduction: 'y'.repeat(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH),
        tipsForWork: 'z'.repeat(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH),
        dailyPrayer: 'a'.repeat(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH),
        days: [
          {
            date: new Date(),
            title: 'b'.repeat(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH), // używamy tej samej co dla bulletin title
            sections: [
              {
                order: 1,
                type: SectionType.CUSTOM_TEXT,
                title: 'c'.repeat(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH), // używamy tej samej
                content: 'd'.repeat(VALIDATOR_SETTINGS.BULLETIN_DAY_SECTION_CONTENT_MAX_LENGTH),
                settings: {
                  expanded: true,
                  includeInPdf: false,
                } satisfies BulletinSectionSettingsDto,
              } satisfies CreateBulletinDaySectionDto,
            ],
          } satisfies CreateBulletinDayDto,
        ],
      } satisfies CreateBulletinDto;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;

      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onBulletinCreated, testEventHandlers.onBulletinDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });

    test('when day has empty title', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: '', // Empty title
          sections: [
            {
              order: 1,
              type: SectionType.CUSTOM_TEXT,
              title: 'Valid Title',
              content: 'Valid Content',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            } satisfies CreateBulletinDaySectionDto,
          ],
        } satisfies CreateBulletinDayDto,
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onBulletinCreated, testEventHandlers.onBulletinDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });

    test('when sections have invalid order (duplicate orders), orders are renumbered when created', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with duplicate orders',
          sections: [
            {
              order: 1,
              type: SectionType.CUSTOM_TEXT,
              title: 'First Section',
              content: 'First Content',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
            {
              order: 1, // Duplicate order
              type: SectionType.CUSTOM_TEXT,
              title: 'Second Section',
              content: 'Second Content',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onBulletinCreated, testEventHandlers.onBulletinDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });

    test('create bulletin with only INTRODUCTION section type', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with Introduction only',
          sections: [
            {
              order: 1,
              type: SectionType.INTRODUCTION,
              title: null,
              content: null,
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      const { data: bulletin }: GetBulletinResponseDto = getBulletinResponse.body;

      expect(bulletin.days[0].sections[0].type).toBe(SectionType.INTRODUCTION);
      expect(bulletin.days[0].sections[0].title).toBeNull();
      expect(bulletin.days[0].sections[0].content).toBeNull();

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

    test('create bulletin with only TIPS_FOR_WORK section type', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with Tips for Work only',
          sections: [
            {
              order: 1,
              type: SectionType.TIPS_FOR_WORK,
              title: null,
              content: null,
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      const { data: bulletin }: GetBulletinResponseDto = getBulletinResponse.body;

      expect(bulletin.days[0].sections[0].type).toBe(SectionType.TIPS_FOR_WORK);
      expect(bulletin.days[0].sections[0].title).toBeNull();
      expect(bulletin.days[0].sections[0].content).toBeNull();

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

    test('create bulletin with only DAILY_PRAYER section type', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with Daily Prayer only',
          sections: [
            {
              order: 1,
              type: SectionType.DAILY_PRAYER,
              title: null,
              content: null,
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      const { data: bulletin }: GetBulletinResponseDto = getBulletinResponse.body;

      expect(bulletin.days[0].sections[0].type).toBe(SectionType.DAILY_PRAYER);
      expect(bulletin.days[0].sections[0].title).toBeNull();
      expect(bulletin.days[0].sections[0].content).toBeNull();

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

    test('when DAILY_PRAYER section has whitespace-only title and content', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with whitespace custom text',
          sections: [
            {
              order: 1,
              type: SectionType.DAILY_PRAYER,
              title: '   ', // Only whitespace
              content: '   ', // Only whitespace
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            } satisfies CreateBulletinDaySectionDto,
          ],
        } satisfies CreateBulletinDayDto,
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);
      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;

      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      expect(getBulletinResponse.statusCode).toBe(200);
      const { data: bulletin }: GetBulletinResponseDto = getBulletinResponse.body;
      expect(bulletin.days[0].sections[0].title).toBeNull();
      expect(bulletin.days[0].sections[0].content).toBeNull();

      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher - handle both cases
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

    test('create bulletin with future date', async () => {
      const requestData = generateValidBulletin();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      requestData.date = futureDate;
      requestData.days![0].date = futureDate;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onBulletinCreated, testEventHandlers.onBulletinDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });

    test('create bulletin with past date', async () => {
      const requestData = generateValidBulletin();
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      requestData.date = pastDate;
      requestData.days![0].date = pastDate;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onBulletinCreated, testEventHandlers.onBulletinDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });

    test('create bulletin with multiple sections in specific order', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with ordered sections',
          sections: [
            {
              order: 3,
              type: SectionType.CUSTOM_TEXT,
              title: 'Third Section',
              content: 'Third Content',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
            {
              order: 1,
              type: SectionType.INTRODUCTION,
              title: null,
              content: null,
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
            {
              order: 5,
              type: SectionType.CUSTOM_TEXT,
              title: 'Fifth Section',
              content: 'Fifth Content',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
            {
              order: 2,
              type: SectionType.TIPS_FOR_WORK,
              title: null,
              content: null,
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
            {
              order: 4,
              type: SectionType.DAILY_PRAYER,
              title: null,
              content: null,
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      const { data: bulletin }: GetBulletinResponseDto = getBulletinResponse.body;

      expect(bulletin.days[0].sections.length).toBe(5);
      // Sections should be ordered by their order field
      expect(bulletin.days[0].sections[0].order).toBe(1);
      expect(bulletin.days[0].sections[1].order).toBe(2);
      expect(bulletin.days[0].sections[2].order).toBe(3);
      expect(bulletin.days[0].sections[3].order).toBe(4);
      expect(bulletin.days[0].sections[4].order).toBe(5);

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

    test('create bulletin with minimal content lengths', async () => {
      const requestData = generateValidBulletin();
      requestData.title = 'A'; // Minimal length
      requestData.introduction = 'B'; // Minimal length
      requestData.tipsForWork = 'C'; // Minimal length
      requestData.dailyPrayer = 'D'; // Minimal length
      requestData.days = [
        {
          date: new Date(),
          title: 'E', // Minimal length
          sections: [
            {
              order: 1,
              type: SectionType.CUSTOM_TEXT,
              title: 'F', // Minimal length
              content: 'G', // Minimal length
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onBulletinCreated, testEventHandlers.onBulletinDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });

    test('create bulletin with sections having high order numbers', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with high order numbers',
          sections: [
            {
              order: 999999,
              type: SectionType.CUSTOM_TEXT,
              title: 'High Order Section',
              content: 'Content for high order section',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
            {
              order: 1000000,
              type: SectionType.INTRODUCTION,
              title: null,
              content: null,
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onBulletinCreated, testEventHandlers.onBulletinDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });

    test('create bulletin with many days and sections', async () => {
      const requestData = generateValidBulletin();
      const baseDate = new Date();

      // Tworzymy biuletyn z wieloma dniami i sekcjami
      requestData.days = [];
      for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
        const dayDate = new Date(baseDate);
        dayDate.setDate(baseDate.getDate() + dayIndex);

        const sections = [];
        for (let sectionIndex = 0; sectionIndex < 10; sectionIndex++) {
          sections.push({
            order: sectionIndex + 1,
            type: SectionType.CUSTOM_TEXT,
            title: `Day ${dayIndex + 1} Section ${sectionIndex + 1}`,
            content: `Content for day ${dayIndex + 1} section ${sectionIndex + 1}`,
            settings: {
              expanded: true,
              includeInPdf: false,
            } satisfies BulletinSectionSettingsDto,
          });
        }

        requestData.days.push({
          date: dayDate,
          title: `Day ${dayIndex + 1}`,
          sections,
        });
      }

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      const getBulletinResponse = await app!.bulletin.get(bulletinId, adminAccessToken);
      const { data: bulletin }: GetBulletinResponseDto = getBulletinResponse.body;

      expect(bulletin.days.length).toBe(5);
      bulletin.days.forEach(day => {
        expect(day.sections.length).toBe(10);
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

    test('when optional fields are explicitly null', async () => {
      const requestData = {
        title: 'Test Bulletin',
        date: new Date(),
        number: 1,
        introduction: null, // Explicitly null
        tipsForWork: null, // Explicitly null
        dailyPrayer: null, // Explicitly null
        days: undefined, // Explicitly undefined (not null)
      };

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onBulletinCreated, testEventHandlers.onBulletinDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
      expect(testEventHandlers.onBulletinDeleted).toHaveBeenCalledTimes(1);
    });

    test('when sections array is empty for a day', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with no sections',
          sections: [], // Empty sections array
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(201);

      const { data: bulletinId }: CreateBulletinResponseDto = createBulletinResponse.body;
      await app!.bulletin.delete(bulletinId, adminAccessToken);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers)
        .filter(
          ([, eventHandler]) =>
            ![testEventHandlers.onBulletinCreated, testEventHandlers.onBulletinDeleted].includes(eventHandler),
        )
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onBulletinCreated).toHaveBeenCalledTimes(1);
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
      expect(errors.some(x => x === errorKeys.bulletin.Title_Too_Long)).toBe(true);

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
      expect(errors.some(x => x === errorKeys.bulletin.Title_Must_Be_A_String)).toBe(true);

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
      expect(errors.some(x => x === errorKeys.bulletin.Title_Is_Required)).toBe(true);
    });

    test('when title is null', async () => {
      const requestData = generateValidBulletin();
      requestData.title = null;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.some(x => x === errorKeys.bulletin.Title_Is_Required)).toBe(true);
    });

    test('when title is not set', async () => {
      const requestData = generateValidBulletin();
      delete requestData.title;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.some(x => x === errorKeys.bulletin.Title_Is_Required)).toBe(true);
    });

    test('when date is null', async () => {
      const requestData = generateValidBulletin();
      requestData.date = null;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.some(x => x === errorKeys.bulletin.Date_Is_Required)).toBe(true);
    });

    test('when date is not set', async () => {
      const requestData = generateValidBulletin();
      delete requestData.date;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.some(x => x === errorKeys.bulletin.Date_Is_Required)).toBe(true);
    });

    test('when number is null', async () => {
      const requestData = generateValidBulletin();
      requestData.number = null;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.some(x => x === errorKeys.bulletin.Number_Is_Required)).toBe(true);
    });

    test('when number is not set', async () => {
      const requestData = generateValidBulletin();
      delete requestData.number;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.some(x => x === errorKeys.bulletin.Number_Is_Required)).toBe(true);
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

    test('when days array contains invalid section types', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with invalid section',
          sections: [
            {
              order: 1,
              type: 'INVALID_TYPE' as any,
              title: 'Test Title',
              content: 'Test Content',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when sections have invalid order (zero or negative)', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with invalid order',
          sections: [
            {
              order: 0, // Invalid order
              type: SectionType.CUSTOM_TEXT,
              title: 'Test Section',
              content: 'Test Content',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when INTRODUCTION section has title or content', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with invalid introduction',
          sections: [
            {
              order: 1,
              type: SectionType.INTRODUCTION,
              title: 'Should be null', // INTRODUCTION nie może mieć title
              content: 'Should be null', // INTRODUCTION nie może mieć content
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when CUSTOM_TEXT section has empty title or content', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with empty custom text',
          sections: [
            {
              order: 1,
              type: SectionType.CUSTOM_TEXT,
              title: '', // Empty title
              content: '', // Empty content
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when CUSTOM_TEXT section has whitespace-only title and content', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with whitespace custom text',
          sections: [
            {
              order: 1,
              type: SectionType.CUSTOM_TEXT,
              title: '   ', // Only whitespace
              content: '   ', // Only whitespace
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            } satisfies CreateBulletinDaySectionDto,
          ],
        } satisfies CreateBulletinDayDto,
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when day has duplicate dates within same bulletin', async () => {
      const requestData = generateValidBulletin();
      const sameDate = new Date();
      requestData.days = [
        {
          date: sameDate,
          title: 'First Day',
          sections: [
            {
              order: 1,
              type: SectionType.CUSTOM_TEXT,
              title: 'Section 1',
              content: 'Content 1',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
        {
          date: sameDate, // Duplicate date
          title: 'Second Day',
          sections: [
            {
              order: 1,
              type: SectionType.CUSTOM_TEXT,
              title: 'Section 2',
              content: 'Content 2',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when introduction field exceeds maximum length', async () => {
      const requestData = generateValidBulletin();
      requestData.introduction = 'x'.repeat(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH + 1);

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when tipsForWork field exceeds maximum length', async () => {
      const requestData = generateValidBulletin();
      requestData.tipsForWork = 'x'.repeat(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH + 1);

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when dailyPrayer field exceeds maximum length', async () => {
      const requestData = generateValidBulletin();
      requestData.dailyPrayer = 'x'.repeat(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH + 1);

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when section title exceeds maximum length', async () => {
      const requestData = generateValidBulletin();
      requestData.days![0].sections[0].title = 'x'.repeat(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH + 1);

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');
      expect(errors.filter(x => x !== errorKeys.bulletin.Section_Title_Too_Long).length).toBe(0);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when day title exceeds maximum length', async () => {
      const requestData = generateValidBulletin();
      requestData.days![0].title = 'x'.repeat(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH + 1);

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

    test('when day date is null', async () => {
      const requestData = generateValidBulletin();
      requestData.days![0].date = null as any;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when section order is not a number', async () => {
      const requestData = generateValidBulletin();
      requestData.days![0].sections[0].order = 'invalid' as any;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when TIPS_FOR_WORK section has title or content', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with invalid tips for work',
          sections: [
            {
              order: 1,
              type: SectionType.TIPS_FOR_WORK,
              title: 'Should be null', // TIPS_FOR_WORK nie może mieć title
              content: 'Should be null', // TIPS_FOR_WORK nie może mieć content
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when DAILY_PRAYER section has title or content', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with invalid daily prayer',
          sections: [
            {
              order: 1,
              type: SectionType.DAILY_PRAYER,
              title: 'Should be null', // DAILY_PRAYER nie może mieć title
              content: 'Should be null', // DAILY_PRAYER nie może mieć content
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when CUSTOM_TEXT section has null title but valid content', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with null title custom text',
          sections: [
            {
              order: 1,
              type: SectionType.CUSTOM_TEXT,
              title: null, // Invalid for CUSTOM_TEXT
              content: 'Valid content',
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when CUSTOM_TEXT section has valid title but null content', async () => {
      const requestData = generateValidBulletin();
      requestData.days = [
        {
          date: new Date(),
          title: 'Day with null content custom text',
          sections: [
            {
              order: 1,
              type: SectionType.CUSTOM_TEXT,
              title: 'Valid title',
              content: null, // Invalid for CUSTOM_TEXT
              settings: {
                expanded: true,
                includeInPdf: false,
              } satisfies BulletinSectionSettingsDto,
            },
          ],
        },
      ];

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when days array is not an array', async () => {
      const requestData = generateValidBulletin();
      requestData.days = 'invalid' as any;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when date is an invalid date string', async () => {
      const requestData = generateValidBulletin();
      requestData.date = 'invalid-date' as any;

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when multiple validation errors occur simultaneously', async () => {
      const requestData = generateValidBulletin();
      // Kombinacja różnych błędów
      requestData.title = ''; // Empty title
      requestData.number = 0; // Invalid number
      requestData.introduction = 'x'.repeat(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH + 1); // Too long
      requestData.days![0].sections[0].content = 'x'.repeat(
        VALIDATOR_SETTINGS.BULLETIN_DAY_SECTION_CONTENT_MAX_LENGTH + 1,
      ); // Too long

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);
      expect(createBulletinResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const data = createBulletinResponse.body.data as BadRequestException;
      const errors = data.message.split(',');

      // Sprawdzamy czy występuje więcej niż jeden błąd
      expect(errors.length).toBeGreaterThan(1);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when section type is valid but casing is different', async () => {
      const requestData = generateValidBulletin();
      requestData.days![0].sections[0].type = 'CustomText' as any; // Different case

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when bulletin number is a float', async () => {
      const requestData = generateValidBulletin();
      requestData.number = 1.5; // Float instead of integer

      const createBulletinResponse = await app!.bulletin.create(requestData, adminAccessToken);
      expect(createBulletinResponse.statusCode).toBe(400);

      // checking events running via eventDispatcher
      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
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
