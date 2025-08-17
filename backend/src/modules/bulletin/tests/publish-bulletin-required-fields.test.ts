import { ILoginModel } from '@core';
import { errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { getAdminLoginData } from '@utils';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';

describe('POST /bulletins/:id/publish - required fields validation', () => {
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

  test('fails when introduction is missing', async () => {
    const data = generateValidBulletin();
    data.introduction = '' as any; // empty string should fail at publish-time

    const createRes = await app!.bulletin.create(data, adminAccessToken);
    expect(createRes.statusCode).toBe(201);
    const { data: id }: CreateBulletinResponseDto = createRes.body;

    const publishRes = await app!.bulletin.publish(id, adminAccessToken);
    expect(publishRes.statusCode).toBe(400);
    const message = (publishRes.body.data?.message ?? publishRes.body.message) as string | string[] | undefined;
    if (Array.isArray(message)) {
      expect(message).toContain(errorKeys.bulletin.Introduction_Is_Required);
    } else {
      expect(String(message)).toEqual(expect.stringContaining(errorKeys.bulletin.Introduction_Is_Required));
    }

    await app!.bulletin.delete(id, adminAccessToken);
  });

  test('fails when tipsForWork is missing', async () => {
    const data = generateValidBulletin();
    data.tipsForWork = '' as any;

    const createRes = await app!.bulletin.create(data, adminAccessToken);
    expect(createRes.statusCode).toBe(201);
    const { data: id }: CreateBulletinResponseDto = createRes.body;

    const publishRes = await app!.bulletin.publish(id, adminAccessToken);
    expect(publishRes.statusCode).toBe(400);
    const message = (publishRes.body.data?.message ?? publishRes.body.message) as string | string[] | undefined;
    if (Array.isArray(message)) {
      expect(message).toContain(errorKeys.bulletin.Tips_For_Work_Is_Required);
    } else {
      expect(String(message)).toEqual(expect.stringContaining(errorKeys.bulletin.Tips_For_Work_Is_Required));
    }

    await app!.bulletin.delete(id, adminAccessToken);
  });

  test('fails when dailyPrayer is missing', async () => {
    const data = generateValidBulletin();
    data.dailyPrayer = '' as any;

    const createRes = await app!.bulletin.create(data, adminAccessToken);
    expect(createRes.statusCode).toBe(201);
    const { data: id }: CreateBulletinResponseDto = createRes.body;

    const publishRes = await app!.bulletin.publish(id, adminAccessToken);
    expect(publishRes.statusCode).toBe(400);
    const message = (publishRes.body.data?.message ?? publishRes.body.message) as string | string[] | undefined;
    if (Array.isArray(message)) {
      expect(message).toContain(errorKeys.bulletin.Daily_Prayer_Is_Required);
    } else {
      expect(String(message)).toEqual(expect.stringContaining(errorKeys.bulletin.Daily_Prayer_Is_Required));
    }

    await app!.bulletin.delete(id, adminAccessToken);
  });

  test('fails when title is missing at publish time (set to empty string via update)', async () => {
    const data = generateValidBulletin();

    const createRes = await app!.bulletin.create(data, adminAccessToken);
    expect(createRes.statusCode).toBe(201);
    const { data: id }: CreateBulletinResponseDto = createRes.body;

    // Make title invalid for publish
    const updateRes = await app!.bulletin.update(id, { title: '' } as any, adminAccessToken);
    expect(updateRes.statusCode).toBe(200);

    const publishRes = await app!.bulletin.publish(id, adminAccessToken);
    expect(publishRes.statusCode).toBe(400);
    const message = (publishRes.body.data?.message ?? publishRes.body.message) as string | string[] | undefined;
    if (Array.isArray(message)) {
      expect(message).toContain(errorKeys.bulletin.Title_Is_Required);
    } else {
      expect(String(message)).toEqual(expect.stringContaining(errorKeys.bulletin.Title_Is_Required));
    }

    await app!.bulletin.delete(id, adminAccessToken);
  });

  test('fails when number is missing at publish time (set to null via update)', async () => {
    const data = generateValidBulletin();

    const createRes = await app!.bulletin.create(data, adminAccessToken);
    expect(createRes.statusCode).toBe(201);
    const { data: id }: CreateBulletinResponseDto = createRes.body;

    // Make number invalid for publish
    const updateRes = await app!.bulletin.update(id, { number: null } as any, adminAccessToken);
    expect(updateRes.statusCode).toBe(200);

    const publishRes = await app!.bulletin.publish(id, adminAccessToken);
    expect(publishRes.statusCode).toBe(400);
    const message = (publishRes.body.data?.message ?? publishRes.body.message) as string | string[] | undefined;
    if (Array.isArray(message)) {
      expect(message).toContain(errorKeys.bulletin.Number_Is_Required);
    } else {
      expect(String(message)).toEqual(expect.stringContaining(errorKeys.bulletin.Number_Is_Required));
    }

    await app!.bulletin.delete(id, adminAccessToken);
  });

  test('fails when date is missing at publish time (set to null via update)', async () => {
    const data = generateValidBulletin();

    const createRes = await app!.bulletin.create(data, adminAccessToken);
    expect(createRes.statusCode).toBe(201);
    const { data: id }: CreateBulletinResponseDto = createRes.body;

    // Make date invalid for publish
    const updateRes = await app!.bulletin.update(id, { date: null } as any, adminAccessToken);
    expect(updateRes.statusCode).toBe(200);

    const publishRes = await app!.bulletin.publish(id, adminAccessToken);
    expect(publishRes.statusCode).toBe(400);
    const message = (publishRes.body.data?.message ?? publishRes.body.message) as string | string[] | undefined;
    if (Array.isArray(message)) {
      expect(message).toContain(errorKeys.bulletin.Date_Is_Required);
    } else {
      expect(String(message)).toEqual(expect.stringContaining(errorKeys.bulletin.Date_Is_Required));
    }

    await app!.bulletin.delete(id, adminAccessToken);
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
