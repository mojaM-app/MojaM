import { DataStoredInToken, TokenData } from '@/modules/auth/interfaces/auth.interface';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { BaseService } from '@modules/common/base.service';
import { IUser } from '@modules/users/interfaces/user.interface';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Service } from 'typedi';
import { LoginDto } from '../dtos/login.dto';

@Service()
export class AuthService extends BaseService {
  // public async signup(userData: CreateUserDto): Promise<IUser> {
  //   const findUser: IUser = await this.users.findUnique({ where: { email: userData.email } });
  //   if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

  //   const hashedPassword = await hash(userData.password, 10);
  //   const createUserData: Promise<IUser> = this.users.create({ data: { ...userData, password: hashedPassword } });

  //   return createUserData;
  // }

  public async login(loginData: LoginDto): Promise<{ cookie: string; user: IUser }> {
    const user: IUser = await this.users.findUnique({ where: { login: loginData.login } });

    if (!user) {
      throw new HttpException(409, 'Login and password are not matching');
    }

    const isPasswordMatching: boolean = await compare(loginData.password, user.password);
    if (!isPasswordMatching) {
      throw new HttpException(409, 'Login and password are not matching');
    }

    const tokenData = this.createToken(user);
    const cookie = this.createCookie(tokenData);

    return { cookie, user };
  }

  public async logout(userData: IUser): Promise<IUser> {
    const findUser: IUser = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public createToken(user: IUser): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
