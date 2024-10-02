import { App } from '@/app';
import { DbConnection } from '@db';
import { LoginDto } from '@modules/auth';
import { SystemPermission } from '@modules/permissions';
import { UserRoute } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';
import { loginAs } from '@modules/users/tests/user-tests.helpers';
import { getAdminLoginData } from '@utils/tests.utils';
import request from 'supertest';

describe('Cache user data tests', () => {
  let userRouter: UserRoute;
  let app: App;
  let findOneByFn: any;
  let adminAccessToken: string | undefined;
  let adminUuid: string | undefined;

  beforeAll(async () => {
    jest.resetAllMocks();

    findOneByFn = jest.fn().mockImplementation(async () => {
      return await ({
        _is_from_mock_: true,
        id: 1,
        uuid: adminUuid,
        isActive: true,
      } as unknown as Promise<User>);
    });

    const dbMock = {
      users: {
        findOneBy: findOneByFn,
        count: () => {
          return 1;
        },
        findBy: () => {
          return [
            {
              _is_from_mock_: true,
              id: 1,
              uuid: '2eaa394a-649d-44c1-b797-4a9e4ed2f836',
              salt: '22fae28a2abbb54a638cb5b7f1acb2e9',
              refreshTokenKey: 'aedc7970d693ea6e4d71e39bffa7dc4034bae8e858b1ad2bb65a5ffd8356db41',
              password:
                '0054475aec0228265ef119a559090cf84fe6a986ce5fa6a621ea22d965087408aaab71efcb84eff4df5106bdd8304b0b8e446ff3ebdd555b588549e586df5c52',
              isActive: true,
            },
          ];
        },
        update: () => {
          return { _is_from_mock_: true };
        },
        findOne: () => {
          return { _is_from_mock_: true };
        },
      },
      userSystemPermissions: {
        createQueryBuilder: () => {
          return {
            where: () => {
              return {
                select: () => {
                  return {
                    getMany: () => [{ _is_from_mock_: true, userId: 1, systemPermission: SystemPermission.PreviewUserProfile }],
                  };
                },
              };
            },
          };
        },
      },
    };

    DbConnection.getDbContext = jest.fn().mockImplementation(() => {
      return dbMock;
    });

    userRouter = new UserRoute();
    app = new App([userRouter]);
    const { email: login, password } = getAdminLoginData();
    const adminLoginResult = await loginAs(app, { email: login, password } satisfies LoginDto);
    adminAccessToken = adminLoginResult?.accessToken;
    adminUuid = adminLoginResult?.id;
  });

  it('Should store userId', async () => {
    let response = await request(app.getServer()).get(`${userRouter.path}/${adminUuid}`).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(200);

    response = await request(app.getServer()).get(`${userRouter.path}/${adminUuid}`).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(200);

    expect(findOneByFn).toHaveBeenCalledTimes(5);
  });

  afterAll(async () => {
    await app.closeDbConnection();
    jest.resetAllMocks();
  });
});
