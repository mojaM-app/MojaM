import { ACCESS_TOKEN_ALGORITHM, USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { IPermissionModuleBoundary, IUserModuleBoundary } from '@core';
import { userToIUser } from '@db';
import { events } from '@events';
import { BadRequestException, errorKeys, TranslatableHttpException } from '@exceptions';
import { BaseService } from '@modules/common';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { decode, JwtPayload, sign, verify, VerifyErrors } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import { Inject, Service } from 'typedi';
import {
  getAccessTokenExpiration,
  getAccessTokenSecret,
  getRefreshTokenExpiration,
  getRefreshTokenSecret,
  getTokenAudience,
  getTokenIssuer,
} from '../../../middlewares/authorization/set-identity.middleware';
import { User } from './../../../dataBase/entities/users/user.entity';
import { PasscodeService } from './passcode.service';
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
  constructor(
    @Inject('USER_MODULE') private readonly _userModule: IUserModuleBoundary,
    @Inject('PERMISSION_MODULE') private readonly _permissionModule: IPermissionModuleBoundary,
    private readonly _passcodeService: PasscodeService,
  ) {
    super();
  }

  public async login(data: LoginDto): Promise<ILoginResult> {
    const users: User[] = await this._userModule.findManyByLogin(data?.email, data?.phone);

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
      await this._userModule.updateAfterLogin(user.id);
    } else {
      const failedLoginAttempts = await this._userModule.increaseFailedLoginAttempts(user.id, user.failedLoginAttempts);

      this._eventDispatcher.dispatch(events.users.failedLoginAttempt, new FailedLoginAttemptEvent(user));

      if (failedLoginAttempts >= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS) {
        await this._userModule.lockOut(user.id);

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

    const user = await this._userModule.getByUuid(userUuid as string);

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
    const userPermissions = await this._permissionModule.getUserPermissions(user);

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
