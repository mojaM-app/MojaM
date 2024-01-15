import { SECRET_AUDIENCE, SECRET_ISSUER, SECRET_KEY } from '@config';
import { User } from '@db/DbModels';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { DataStoredInToken, LoginDto, TokenData } from '@modules/auth';
import { BaseService, userToIUser } from '@modules/common';
import { PermissionsRepository, SystemPermission } from '@modules/permissions';
import { IUser, UsersRepository } from '@modules/users';
import { isNullOrEmptyString } from '@utils';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';

@Service()
export class AuthService extends BaseService {
  private readonly _userRepository: UsersRepository;
  private readonly _permissionRepository: PermissionsRepository;

  public constructor() {
    super();
    this._userRepository = Container.get(UsersRepository);
    this._permissionRepository = Container.get(PermissionsRepository);
  }

  public async login(loginData: LoginDto): Promise<{ cookie: string; user: IUser }> {
    if (isNullOrEmptyString(loginData?.login) || isNullOrEmptyString(loginData?.password)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const users: User[] = await this._userRepository.findManyByLogin(loginData.login);

    if (users?.length !== 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const user: User = users[0];
    const isPasswordMatching: boolean = await compare(loginData.password ?? '', user.password);
    if (!isPasswordMatching) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    if (!user.isActive) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.User_Is_Not_Active);
    }

    const userPermissions = await this._permissionRepository.getUserPermissions(user.id);
    const tokenData = this.createToken(user, userPermissions);

    return { cookie: this.createCookie(tokenData), user: userToIUser(user) };
  }

  // public async logout(userData: IUser): Promise<IUser> {
  //   const findUser: IUser = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   return findUser;
  // }

  public createToken(user: IUser, permissions: SystemPermission[]): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.uuid, permissions };

    const expiresIn: number = 10 * 60; // expressed in seconds

    return {
      expiresIn,
      token: sign(dataStoredInToken, SECRET_KEY!, {
        expiresIn,
        notBefore: '0', // Cannot use before now, can be configured to be deferred.
        algorithm: 'HS256',
        audience: SECRET_AUDIENCE,
        issuer: SECRET_ISSUER,
      }),
    };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
