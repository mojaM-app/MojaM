import { SECRET_KEY } from '@config';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { error_keys } from '@exceptions/error.keys';
import { BaseService } from '@modules/common/base.service';
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

    const tokenData = this.createToken(user);
    const cookie = this.createCookie(tokenData);

    return { cookie, user: UsersHelper.UserToIUser(user) };
  }

  // public async logout(userData: IUser): Promise<IUser> {
  //   const findUser: IUser = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   return findUser;
  // }

  public createToken(user: IUser): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.uuid, permissions: [] };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 10 * 60; //expressed in seconds

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
