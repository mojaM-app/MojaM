import { type ILoginModel, type IUser, SystemPermissions } from '@core';
import { DbConnectionManager } from '@db';
import { testHelpers } from '@helpers';
import { getAdminLoginData } from '@utils';
import { User } from '../../../dataBase/entities/users/user.entity';
import { TestApp } from '../../../helpers/test-helpers/test.app';

describe('Cache user data tests', () => {
  let app: TestApp | undefined;
  let findOneByFn: any;
  let adminAccessToken: string | undefined;
  let adminUuid: string | undefined;

  beforeAll(async () => {
    jest.restoreAllMocks();

    const adminLoginData = getAdminLoginData();
    findOneByFn = jest.fn().mockImplementation(async () => {
      return await ({
        _is_from_mock_: true,
        id: 1,
        uuid: adminUuid,
        email: adminLoginData.email,
        phone: adminLoginData.phone,
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
          uuid: adminLoginData.uuid,
          salt: adminLoginData.salt,
          refreshTokenKey: adminLoginData.refreshTokenKey,
          passcode:
            'e6406308f2432e12965cbc9639f215d0574b6f9de2f310c5ff5535578ac081898e37bc46a26a017cecb773bebc792399373d6ecfc0dacb5b95b87d25ca33dd3c',
          isActive: true,
          email: adminLoginData.email,
          phone: adminLoginData.phone,
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
                    getMany: () => [
                      { _is_from_mock_: true, userId: 1, systemPermission: { id: SystemPermissions.EditUser } },
                    ],
                  };
                },
              };
            },
          };
        },
      },
    };

    jest.spyOn(DbConnectionManager, 'getDbContext').mockImplementation(() => {
      return dbMock as any;
    });

    app = await testHelpers.getTestApp();
    const { email, passcode } = getAdminLoginData();
    const adminLoginResult = await app.auth.loginAs({ email, passcode } satisfies ILoginModel);
    adminAccessToken = adminLoginResult?.accessToken;
    adminUuid = adminLoginResult?.id;
  });

  it('Should store userId', async () => {
    //if this test fails, check if getAdminLoginData returns same data as in the database
    let getUserResponse = await app!.user.get(adminUuid!, adminAccessToken);
    expect(getUserResponse.statusCode).toBe(200);

    getUserResponse = await app!.user.get(adminUuid!, adminAccessToken);
    expect(getUserResponse.statusCode).toBe(200);

    expect(findOneByFn).toHaveBeenCalledTimes(5);
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.restoreAllMocks();
  });
});
