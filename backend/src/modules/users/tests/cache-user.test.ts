import { ILoginModel, IUser, SystemPermissions } from '@core';
import { DbConnection } from '@db';
import { testHelpers } from '@helpers';
import { UserRoute } from '@modules/users';
import { getAdminLoginData } from '@utils';
import request from 'supertest';
import { User } from '../../../dataBase/entities/users/user.entity';
import { TestApp } from '../../../helpers/tests.utils';

describe('Cache user data tests', () => {
  let app: TestApp | undefined;
  let findOneByFn: any;
  let adminAccessToken: string | undefined;
  let adminUuid: string | undefined;

  beforeAll(async () => {
    jest.restoreAllMocks();

    findOneByFn = jest.fn().mockImplementation(async () => {
      return await ({
        _is_from_mock_: true,
        id: 1,
        uuid: adminUuid,
        email: 'admin@domain.com',
        phone: '123456789',
        isActive: true,
        getFirstLastName: (): string => 'John Doe',
        getFirstLastNameOrEmail: (): string => 'John Doe',
        getLastFirstName: (): string => 'Doe John',
        getLastFirstNameOrEmail: (): string => 'Doe John',
        isAdmin: (): boolean => true,
      } satisfies IUser & {
        _is_from_mock_: boolean;
        id: number;
        uuid?: string;
        isActive: boolean;
      } as unknown as Promise<User>);
    });

    const findBy = (): any => {
      return [
        {
          _is_from_mock_: true,
          id: 1,
          uuid: '2eaa394a-649d-44c1-b797-4a9e4ed2f836',
          salt: '22fae28a2abbb54a638cb5b7f1acb2e9',
          refreshTokenKey: 'aedc7970d693ea6e4d71e39bffa7dc4034bae8e858b1ad2bb65a5ffd8356db41',
          passcode:
            '0054475aec0228265ef119a559090cf84fe6a986ce5fa6a621ea22d965087408aaab71efcb84eff4df5106bdd8304b0b8e446ff3ebdd555b588549e586df5c52',
          isActive: true,
          email: 'admin@domain.com',
          phone: '123456789',
          getFirstLastName: (): string => 'John Doe',
          getFirstLastNameOrEmail: (): string => 'John Doe',
          getLastFirstName: (): string => 'Doe John',
          getLastFirstNameOrEmail: (): string => 'Doe John',
          isAdmin: (): boolean => true,
        } satisfies IUser & {
          _is_from_mock_: boolean;
          id: number;
          uuid: string;
          salt: string;
          refreshTokenKey: string;
          passcode: string;
          isActive: boolean;
        },
      ];
    };

    const dbMock = {
      users: {
        findOneBy: findOneByFn,
        count: (): number => {
          return 1;
        },
        findBy: (): any => {
          return findBy();
        },
        update: (): any => {
          return { _is_from_mock_: true };
        },
        findOne: (): any => {
          return { _is_from_mock_: true };
        },
        createQueryBuilder: (): any => {
          return {
            where: (): any => {
              return {
                getOne: findBy,
              };
            },
          };
        },
      },
      userSystemPermissions: {
        createQueryBuilder: (): any => {
          return {
            innerJoinAndSelect: (): any => {
              return {
                where: (): any => {
                  return {
                    getMany: () => [{ _is_from_mock_: true, userId: 1, systemPermission: { id: SystemPermissions.EditUser } }],
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

    app = await testHelpers.getTestApp();
    const { email, passcode } = getAdminLoginData();
    const adminLoginResult = await testHelpers.loginAs(app, { email, passcode } satisfies ILoginModel);
    adminAccessToken = adminLoginResult?.accessToken;
    adminUuid = adminLoginResult?.id;
  });

  it('Should store userId', async () => {
    let response = await request(app!.getServer()).get(`${UserRoute.path}/${adminUuid}`).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(200);

    response = await request(app!.getServer()).get(`${UserRoute.path}/${adminUuid}`).send().set('Authorization', `Bearer ${adminAccessToken}`);
    expect(response.statusCode).toBe(200);

    expect(findOneByFn).toHaveBeenCalledTimes(5);
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.restoreAllMocks();
  });
});
