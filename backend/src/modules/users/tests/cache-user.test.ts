import { App } from '@/app';
import DbClient from '@db/DbClient';
import { LoginDto } from '@modules/auth';
import { SystemPermission } from '@modules/permissions';
import { UsersRoute } from '@modules/users';
import { loginAs } from '@modules/users/tests/user-tests.helpers';
import { Prisma, User } from '@prisma/client';
import { getAdminLoginData } from '@utils/tests.utils';
import request from 'supertest';

describe('Cache user data tests', () => {
  let usersRoute: UsersRoute;
  let app: App;
  let findUniqueFn: any;
  let adminAuthToken: string;
  let adminUuid: string;
  beforeAll(async () => {
    jest.resetAllMocks();

    findUniqueFn = jest.fn().mockImplementation(() => {
      return {
        _is_from_mock_: true,
        id: 1,
        uuid: adminUuid,
        isActive: true,
      } as unknown as Prisma.Prisma__UserClient<User>;
    });

    const dbMock = {
      user: {
        findUnique: findUniqueFn,
        count: () => {
          return 1;
        },
        findMany: () => {
          return [
            {
              _is_from_mock_: true,
              id: 1,
              uuid: '625edee9-851c-4dfd-a0a5-d676f362e1ca',
              password: '$2b$10$p5Cm0dCkOXiHuW7H3DH4ueq0gS3CNCjMMMiygNujs5Z/6DI2NcaLm',
              isActive: true,
            },
          ];
        },
      },
      userSystemPermission: {
        findMany: () => {
          return [{ _is_from_mock_: true, userId: 1, permissionId: SystemPermission.PreviewUserProfile }];
        },
      },
    };

    DbClient.getDbContext = jest.fn().mockImplementation(() => {
      return dbMock;
    });

    const { email: login, password } = getAdminLoginData();

    usersRoute = new UsersRoute();
    app = new App([usersRoute]);
    const adminAuth = await loginAs(app, <LoginDto>{ login, password });
    adminAuthToken = adminAuth.authToken;
    adminUuid = adminAuth.userLoggedIn.uuid;
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });

  it('Should store userId', async () => {
    let response = await request(app.getServer()).get(`${usersRoute.path}/${adminUuid}`).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(200);

    response = await request(app.getServer()).get(`${usersRoute.path}/${adminUuid}`).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(200);

    expect(findUniqueFn).toHaveBeenCalledTimes(5);
  });
});
