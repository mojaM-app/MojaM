import { SECRET_AUDIENCE, SECRET_ISSUER, SECRET_KEY } from '@config';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { error_keys } from '@exceptions/error.keys';
import { LoginDto } from '@modules/auth/dtos/login.dto';
import { DataStoredInToken } from '@modules/auth/interfaces/DataStoredInToken';
import { TokenData } from '@modules/auth/interfaces/TokenData';
import { BaseService } from '@modules/common/base.service';
import { PermissionRepository } from '@modules/permissions/repositories/permission.repository';
import { SystemPermission } from '@modules/permissions/system-permission.enum';
import UsersHelper from '@modules/users/helpers/users.helper';
import { IUser } from '@modules/users/interfaces/IUser';
import { UserRepository } from '@modules/users/repositories/user.repository';
import { User } from '@prisma/client';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';

@Service()
export class AuthService extends BaseService {
  private readonly _userRepository: UserRepository | undefined = undefined;
  private readonly _permissionRepository: PermissionRepository | undefined = undefined;

  public constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
    this._permissionRepository = Container.get(PermissionRepository);
  }

  public async login(loginData: LoginDto): Promise<{ cookie: string; user: IUser }> {
    const users: User[] = await this._userRepository.findManyByLogin(loginData.login);

    if (users?.length !== 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.login.Invalid_Login_Or_Password);
    }

    const user: User = users[0];
    const isPasswordMatching: boolean = await compare(loginData.password, user.password);
    if (!isPasswordMatching) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.login.Invalid_Login_Or_Password);
    }

    const userPermissions = await this._permissionRepository.getUserPermissions(user.id);
    const tokenData = this.createToken(user, userPermissions);

    return { cookie: this.createCookie(tokenData), user: UsersHelper.UserToIUser(user) };
  }

  // public async logout(userData: IUser): Promise<IUser> {
  //   const findUser: IUser = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   return findUser;
  // }

  public createToken(user: IUser, permissions: SystemPermission[]): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.uuid, permissions: permissions || [] };

    const expiresIn: number = 10 * 60; //expressed in seconds

    return {
      expiresIn,
      token: sign(dataStoredInToken, SECRET_KEY, {
        expiresIn: expiresIn,
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
