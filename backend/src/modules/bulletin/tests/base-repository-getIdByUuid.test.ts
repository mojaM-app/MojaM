import { ILoginModel } from '@core';
import { testHelpers } from '@helpers';
import { getAdminLoginData, isGuid } from '@utils';
import { generateValidBulletin } from './test.helpers';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { CreateBulletinResponseDto } from '../dtos/create-bulletin.dto';

describe('BaseBulletinRepository.getIdByUuid (indirect via routes)', () => {
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

  test('invalid guid returns 404 from controller (id is undefined)', async () => {
    const res = await app!.bulletin.get('invalid-id', adminAccessToken);
    expect(res.statusCode).toBe(404);
  });

  test('valid guid maps to numeric id and endpoint works', async () => {
    const createRes = await app!.bulletin.create(generateValidBulletin(), adminAccessToken);
    expect(createRes.statusCode).toBe(201);
    const { data: id }: CreateBulletinResponseDto = createRes.body;
    expect(isGuid(id)).toBe(true);

    const getRes = await app!.bulletin.get(id, adminAccessToken);
    expect(getRes.statusCode).toBe(200);

    await app!.bulletin.delete(id, adminAccessToken);
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
  });
});
