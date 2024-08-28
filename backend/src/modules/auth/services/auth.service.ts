import { events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import {
  CryptoService,
  DataStoredInToken,
  FailedLoginAttemptEvent,
  ILoginResult,
  InactiveUserTriesToLogInEvent,
  IsLoginValid,
  LockedUserTriesToLogInEvent,
  LoginDto,
  UserLockedOutEvent,
  UserLoggedInEvent
} from '@modules/auth';
import {
  ACCESS_TOKEN_ALGORITHM,
  getAccessTokenSecret,
  getRefreshTokenExpiration,
  getRefreshTokenSecret,
  getTokenAudience,
  getTokenIssuer,
} from '@modules/auth/middlewares/set-identity.middleware';
import { BaseService, userToIUser } from '@modules/common';
import { PermissionsRepository, SystemPermission } from '@modules/permissions';
import { UpdateUserDto, UpdateUserReqDto, UsersRepository } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@utils/constants';
import { sign } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';

@Service()
export class AuthService extends BaseService {
  private readonly _userRepository: UsersRepository;
  private readonly _permissionRepository: PermissionsRepository;
  private readonly _cryptoService: CryptoService;

  public constructor() {
    super();
    this._userRepository = Container.get(UsersRepository);
    this._permissionRepository = Container.get(PermissionsRepository);
    this._cryptoService = Container.get(CryptoService);
  }

  public async login(loginData: LoginDto): Promise<ILoginResult> {
    if (isNullOrEmptyString(loginData?.email) || isNullOrEmptyString(loginData?.password)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const users: User[] = await this._userRepository.findManyByLogin(loginData.email, loginData.phone);

    if (users?.length !== 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const user: User = users[0];
    const userDto = userToIUser(user);

    if (!user.isActive) {
      this._eventDispatcher.dispatch(events.users.inactiveUserTriesToLogIn, new InactiveUserTriesToLogInEvent(userDto));
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.User_Is_Not_Active);
    }

    if (user.isLockedOut) {
      this._eventDispatcher.dispatch(events.users.lockedUserTriesToLogIn, new LockedUserTriesToLogInEvent(userDto));
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.User_Is_Locked_Out);
    }

    const isPasswordMatching: boolean = this._cryptoService.passwordMatches(loginData.password ?? '', user.salt, user.password);

    if (!isPasswordMatching) {
      const failedLoginAttempts = await this._userRepository.increaseFailedLoginAttempts({
        userId: user.id,
        userData: {
          failedLoginAttempts: user.failedLoginAttempts,
        },
        currentUserId: undefined,
      } satisfies UpdateUserReqDto);

      this._eventDispatcher.dispatch(events.users.failedLoginAttempt, new FailedLoginAttemptEvent(userDto));

      if (failedLoginAttempts >= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS) {
        await this._userRepository.lockOutUser({
          userId: user.id,
          userData: {
            isLockedOut: true,
          } satisfies UpdateUserDto,
          currentUserId: undefined,
        } satisfies UpdateUserReqDto);

        this._eventDispatcher.dispatch(events.users.userLockedOut, new UserLockedOutEvent(userDto));
      }

      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const userPermissions = await this._permissionRepository.getUserPermissions(user.id);
    const accessToken = this.createAccessToken(user, userPermissions);
    const refreshToken = this.createRefreshToken(user);

    this._eventDispatcher.dispatch(events.users.userLoggedIn, new UserLoggedInEvent(userDto));

    return {
      user: userDto,
      accessToken,
      refreshToken,
    } satisfies ILoginResult;
  }

  public async isEmailSufficientToLogIn(data: IsLoginValid): Promise<boolean> {
    if (isNullOrUndefined(data) || isNullOrEmptyString(data.email)) {
      return true;
    }

    const users: User[] = await this._userRepository.findManyByLogin(data.email);

    return (users?.length ?? 0) < 2;
  }

  // public async logout(userData: IUser): Promise<IUser> {
  //   const findUser: IUser = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   return findUser;
  // }

  private createRefreshToken(user: User): string {
    return sign({ userId: user.uuid }, getRefreshTokenSecret(user.id, user.refreshTokenKey), {
      expiresIn: getRefreshTokenExpiration(),
      notBefore: '0',
      algorithm: ACCESS_TOKEN_ALGORITHM,
      audience: getTokenAudience(),
      issuer: getTokenIssuer(),
      subject: user.uuid,
    });
  }

  private createAccessToken(user: User, permissions: SystemPermission[]): string {
    const dataStoredInToken = {
      permissions,
      userName: user.firstName + ' ' + user.lastName,
    } satisfies DataStoredInToken;

    return sign(dataStoredInToken, getAccessTokenSecret(), {
      expiresIn: '10m',
      notBefore: '0',
      algorithm: ACCESS_TOKEN_ALGORITHM,
      audience: getTokenAudience(),
      issuer: getTokenIssuer(),
      subject: user.uuid,
    });
  }
}
