import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { userToIUser } from '@db';
import { events } from '@events';
import { BadRequestException, errorKeys, TranslatableHttpException } from '@exceptions';
import {
  FailedLoginAttemptEvent,
  IDataStoredInToken,
  ILoginResult,
  InactiveUserTriesToLogInEvent,
  LockedUserTriesToLogInEvent,
  LoginDto,
  PasscodeService,
  RefreshTokenDto,
  UserLockedOutEvent,
  UserLoggedInEvent,
  UserRefreshedTokenEvent,
} from '@modules/auth';
import {
  ACCESS_TOKEN_ALGORITHM,
  getAccessTokenExpiration,
  getAccessTokenSecret,
  getRefreshTokenExpiration,
  getRefreshTokenSecret,
  getTokenAudience,
  getTokenIssuer,
} from '@modules/auth/middlewares/set-identity.middleware';
import { BaseService } from '@modules/common';
import { UserPermissionsRepository } from '@modules/permissions';
import { UserRepository } from '@modules/users';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { decode, JwtPayload, sign, verify, VerifyErrors } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';
import { User } from './../../../dataBase/entities/users/user.entity';

@Service()
export class AuthService extends BaseService {
  private readonly _userRepository: UserRepository;
  private readonly _permissionRepository: UserPermissionsRepository;
  private readonly _passcodeService: PasscodeService;

  constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
    this._permissionRepository = Container.get(UserPermissionsRepository);
    this._passcodeService = Container.get(PasscodeService);
  }

  public async login(data: LoginDto): Promise<ILoginResult> {
    const users: User[] = await this._userRepository.findManyByLogin(data?.email, data?.phone);

    if (users?.length !== 1) {
      throw new BadRequestException(errorKeys.login.Invalid_Login_Or_Passcode);
    }

    const user: User = users[0];

    if (isNullOrEmptyString(user.passcode)) {
      throw new BadRequestException(errorKeys.login.User_Passcode_Is_Not_Set);
    }

    if (!user.isActive) {
      this._eventDispatcher.dispatch(events.users.inactiveUserTriesToLogIn, new InactiveUserTriesToLogInEvent(user));
      throw new BadRequestException(errorKeys.login.User_Is_Not_Active);
    }

    if (user.isLockedOut) {
      this._eventDispatcher.dispatch(events.users.lockedUserTriesToLogIn, new LockedUserTriesToLogInEvent(user));
      throw new BadRequestException(errorKeys.login.Account_Is_Locked_Out);
    }

    const isPasscodeMatching: boolean = this._passcodeService.match(user, data.passcode);

    if (isPasscodeMatching) {
      await this._userRepository.updateAfterLogin(user.id);
    } else {
      const failedLoginAttempts = await this._userRepository.increaseFailedLoginAttempts(user.id, user.failedLoginAttempts);

      this._eventDispatcher.dispatch(events.users.failedLoginAttempt, new FailedLoginAttemptEvent(user));

      if (failedLoginAttempts >= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS) {
        await this._userRepository.lockOut(user.id);

        this._eventDispatcher.dispatch(events.users.userLockedOut, new UserLockedOutEvent(user));

        throw new BadRequestException(errorKeys.login.Account_Is_Locked_Out);
      }

      throw new BadRequestException(errorKeys.login.Invalid_Login_Or_Passcode);
    }

    const accessToken = await this.createAccessTokenAsync(user);
    const refreshToken = this.createRefreshToken(user);

    this._eventDispatcher.dispatch(events.users.userLoggedIn, new UserLoggedInEvent(user));

    return {
      user: userToIUser(user),
      accessToken,
      refreshToken,
    } satisfies ILoginResult;
  }

  public async refreshAccessToken(data: RefreshTokenDto): Promise<string | null> {
    if (isNullOrEmptyString(data?.refreshToken)) {
      return null;
    }

    const userUuid = this.getUserIdFromRefreshToken(data.refreshToken!);

    const user = await this._userRepository.getByUuid(userUuid);

    if (isNullOrUndefined(user)) {
      return null;
    }

    verify(
      data.refreshToken!,
      getRefreshTokenSecret(user!.id, user!.refreshTokenKey),
      {
        complete: true,
        algorithms: [ACCESS_TOKEN_ALGORITHM],
        clockTolerance: 0,
        ignoreExpiration: false,
        ignoreNotBefore: false,
        audience: getTokenAudience(),
        issuer: getTokenIssuer(),
      },
      (err: VerifyErrors | null): void => {
        if (!isNullOrUndefined(err)) {
          throw new TranslatableHttpException(StatusCode.ClientErrorLoginTimeOut, errorKeys.login.Refresh_Token_Expired);
        }
      },
    );

    const accessToken = await this.createAccessTokenAsync(user!);

    this._eventDispatcher.dispatch(events.users.userRefreshedToken, new UserRefreshedTokenEvent(user!));

    return accessToken;
  }

  // public async logout(userData: IUserDto): Promise<IUserDto> {
  //   const findUser: IUserDto = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
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

  private async createAccessTokenAsync(user: User): Promise<string> {
    const userPermissions = await this._permissionRepository.get(user);

    const dataStoredInToken = {
      permissions: userPermissions,
      userName: user.getFirstLastName(),
      email: user.email,
      phone: user.phone,
    } satisfies IDataStoredInToken;

    return sign(dataStoredInToken, getAccessTokenSecret(), {
      expiresIn: getAccessTokenExpiration(),
      notBefore: '0',
      algorithm: ACCESS_TOKEN_ALGORITHM,
      audience: getTokenAudience(),
      issuer: getTokenIssuer(),
      subject: user.uuid,
    });
  }

  private getUserIdFromRefreshToken(refreshToken: string): string | null {
    const { userId } = decode(refreshToken, {
      complete: true,
      json: true,
    })?.payload as JwtPayload;

    return userId ?? null;
  }
}
