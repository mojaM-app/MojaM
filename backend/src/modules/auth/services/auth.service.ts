import { SECRET_AUDIENCE, SECRET_ISSUER, SECRET_KEY } from '@config';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { error_keys } from '@exceptions/error.keys';
import { BaseService } from '@modules/common/base.service';
import { SystemPermission } from '@modules/permissions/system-permission.enum';
import UsersHelper from '@modules/users/helpers/users.helper';
import { IUser } from '@modules/users/interfaces/IUser';
import { User } from '@prisma/client';
import { compare } from 'bcrypt';
import { isEmail } from 'class-validator';
import { sign } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import { Service } from 'typedi';
import { LoginDto } from '../dtos/login.dto';
import { DataStoredInToken } from '../interfaces/DataStoredInToken';
import { TokenData } from '../interfaces/TokenData';

@Service()
export class AuthService extends BaseService {
  public async login(loginData: LoginDto): Promise<{ cookie: string; user: IUser }> {
    let users: User[];
    if (isEmail(loginData.login)) {
      users = await this._dbContext.user.findMany({ where: { email: loginData.login } });
    } else {
      users = await this._dbContext.user.findMany({ where: { phone: loginData.login } });
    }

    if (users?.length !== 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.login.Invalid_Login_Or_Password);
    }

    const user: User = users[0];
    const isPasswordMatching: boolean = await compare(loginData.password, user.password);
    if (!isPasswordMatching) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.login.Invalid_Login_Or_Password);
    }

    const permissions = await this._dbContext.userSystemPermission.findMany({ where: { userId: user.id } });
    const tokenData = this.createToken(
      user,
      permissions.map(m => m.permissionId),
    );
    const cookie = this.createCookie(tokenData);

    return { cookie, user: UsersHelper.UserToIUser(user) };
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
