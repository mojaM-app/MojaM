import { ACCESS_TOKEN_ALGORITHM, USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { IPermissionsService, IUserEntity, IUserService, events, BaseService } from '@core';
import { userToIUser } from '@db';
import { BadRequestException, errorKeys, TranslatableHttpException } from '@exceptions';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { decode, JwtPayload, sign, verify, VerifyErrors } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import Container, { Service } from 'typedi';
import { PasscodeService } from './passcode.service';
import {
  getAccessTokenExpiration,
  getAccessTokenSecret,
  getRefreshTokenExpiration,
  getRefreshTokenSecret,
  getTokenAudience,
  getTokenIssuer,
} from '../../../middlewares/authorization/set-identity.middleware';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { FailedLoginAttemptEvent } from '../events/failed-login-attempt-event';
import { InactiveUserTriesToLogInEvent } from '../events/inactive-user-tries-to-log-in-event';
import { LockedUserTriesToLogInEvent } from '../events/locked-user-tries-to-log-in-event';
import { UserLockedOutEvent } from '../events/user-locked-out-event';
import { UserLoggedInEvent } from '../events/user-logged-in-event';
import { UserRefreshedTokenEvent } from '../events/user-refreshed-token-event';
import { IDataStoredInToken } from '../interfaces/data-stored-in-token.interface';
import { ILoginResult } from '../interfaces/login.interfaces';

@Service()
export class AuthService extends BaseService {
  private readonly _userService: IUserService;
  private readonly _permissionsService: IPermissionsService;

  constructor(private readonly _passcodeService: PasscodeService) {
    super();
    this._userService = Container.get<IUserService>('IUserService');
    this._permissionsService = Container.get<IPermissionsService>('IPermissionsService');
  }

  public async login(data: LoginDto): Promise<ILoginResult> {
    const users: IUserEntity[] = await this._userService.findManyByLogin(data?.email, data?.phone);

    if (users?.length !== 1) {
      throw new BadRequestException(errorKeys.login.Invalid_Login_Or_Passcode);
    }

    const user: IUserEntity = users[0];

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
      await this._userService.updateAfterLogin(user.id);
    } else {
      const failedLoginAttempts = await this._userService.increaseFailedLoginAttempts(user.id, user.failedLoginAttempts);

      this._eventDispatcher.dispatch(events.users.failedLoginAttempt, new FailedLoginAttemptEvent(user));

      if (failedLoginAttempts >= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS) {
        await this._userService.lockOut(user.id);

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

    if (isNullOrEmptyString(userUuid)) {
      return null;
    }

    const user = await this._userService.getByUuid(userUuid as string);

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

  private createRefreshToken(user: IUserEntity): string {
    return sign({ userId: user.uuid }, getRefreshTokenSecret(user.id, user.refreshTokenKey), {
      expiresIn: getRefreshTokenExpiration(),
      notBefore: '0',
      algorithm: ACCESS_TOKEN_ALGORITHM,
      audience: getTokenAudience(),
      issuer: getTokenIssuer(),
      subject: user.uuid,
    });
  }

  private async createAccessTokenAsync(user: IUserEntity): Promise<string> {
    const userPermissions = await this._permissionsService.getUserPermissions(user);

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
