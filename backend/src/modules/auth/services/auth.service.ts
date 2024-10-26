import { CLIENT_APP_URL } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import {
  AuthRoute,
  CheckResetPasswordTokenReqDto,
  CheckResetPasswordTokenResultDto,
  CryptoService,
  DataStoredInToken,
  FailedLoginAttemptEvent,
  ILoginResult,
  InactiveUserTriesToLogInEvent,
  LockedUserTriesToLogInEvent,
  LoginDto,
  PasswordService,
  RefreshTokenDto,
  ResetPasswordDto,
  ResetPasswordResultDto,
  UserInfoBeforeLogInResultDto,
  UserLockedOutEvent,
  UserLoggedInEvent,
  UserPasswordChangedEvent,
  UserRefreshedTokenEvent,
  UserTryingToLogInDto,
} from '@modules/auth';
import {
  ACCESS_TOKEN_ALGORITHM,
  getAccessTokenSecret,
  getRefreshTokenExpiration,
  getRefreshTokenSecret,
  getTokenAudience,
  getTokenIssuer,
} from '@modules/auth/middlewares/set-identity.middleware';
import { BaseService, userToIUser, userToIUserProfile } from '@modules/common';
import { EmailService } from '@modules/notifications';
import { PermissionsRepository, SystemPermission } from '@modules/permissions';
import { UserRepository } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@utils/constants';
import { decode, JwtPayload, sign, verify, VerifyErrors } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';
import { ResetPasswordTokensRepository } from '../repositories/reset-password-tokens.repository';

@Service()
export class AuthService extends BaseService {
  private readonly _userRepository: UserRepository;
  private readonly _permissionRepository: PermissionsRepository;
  private readonly _resetPasswordTokensRepository: ResetPasswordTokensRepository;
  private readonly _cryptoService: CryptoService;
  private readonly _passwordService: PasswordService;
  private readonly _emailService: EmailService;

  public constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
    this._permissionRepository = Container.get(PermissionsRepository);
    this._resetPasswordTokensRepository = Container.get(ResetPasswordTokensRepository);
    this._cryptoService = Container.get(CryptoService);
    this._passwordService = Container.get(PasswordService);
    this._emailService = Container.get(EmailService);
  }

  public async getUserInfoBeforeLogIn(data: UserTryingToLogInDto): Promise<UserInfoBeforeLogInResultDto> {
    const result = {
      isEmailSufficientToLogIn: true,
      isPasswordSet: true,
    } satisfies UserInfoBeforeLogInResultDto;

    if (isNullOrUndefined(data) || isNullOrEmptyString(data.email)) {
      return result;
    }

    const users: User[] = await this._userRepository.findManyByLogin(data.email, data.phone);

    if ((users?.length ?? 0) === 0) {
      return result;
    }

    if (users.length > 1) {
      return {
        isEmailSufficientToLogIn: false,
      } satisfies UserInfoBeforeLogInResultDto;
    }

    const user = users[0];
    return {
      isEmailSufficientToLogIn: true,
      isPasswordSet: !isNullOrEmptyString(user.password),
    } satisfies UserInfoBeforeLogInResultDto;
  }

  public async requestResetPassword(data: UserTryingToLogInDto): Promise<boolean> {
    if (isNullOrUndefined(data) || isNullOrEmptyString(data.email)) {
      return true;
    }

    const users: User[] = await this._userRepository.findManyByLogin(data.email, data.phone);

    if ((users?.length ?? 0) !== 1) {
      return true;
    }

    const user = users[0];

    if (!(await this._resetPasswordTokensRepository.isLastTokenExpired(user.id))) {
      return true;
    }

    await this._resetPasswordTokensRepository.deleteTokens(user.id);

    const token = this._cryptoService.generateResetPasswordToken();

    const resetPasswordToken = await this._resetPasswordTokensRepository.createToken(user.id, token);
    const url = CLIENT_APP_URL!.endsWith('/') ? CLIENT_APP_URL!.slice(0, -1) : CLIENT_APP_URL;
    const link = `${url}/${AuthRoute.resetPassword}/${user.uuid}/${resetPasswordToken.token}`;

    return await this._emailService.sendEmailResetPassword(userToIUserProfile(user), link);
  }

  public async checkResetPasswordToken(data: CheckResetPasswordTokenReqDto): Promise<CheckResetPasswordTokenResultDto> {
    const userId = await this._userRepository.getIdByUuid(data.userGuid);

    if (isNullOrUndefined(userId)) {
      return {
        isValid: false,
      } satisfies CheckResetPasswordTokenResultDto;
    }

    const token = await this._resetPasswordTokensRepository.getLastToken(userId!);

    if (isNullOrUndefined(token) || this._resetPasswordTokensRepository.isTokenExpired(token) || token!.token !== data.resetPasswordToken) {
      return {
        isValid: false,
      } satisfies CheckResetPasswordTokenResultDto;
    }

    const user = await this._userRepository.getById(userId);

    return {
      isValid: true,
      userEmail: user?.email,
    } satisfies CheckResetPasswordTokenResultDto;
  }

  public async resetPassword(data: ResetPasswordDto): Promise<ResetPasswordResultDto> {
    if (isNullOrEmptyString(data?.password) || !this._passwordService.isPasswordValid(data.password!)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.Invalid_Password);
    }

    if (isNullOrEmptyString(data?.token)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Reset_Password_Token);
    }

    if (isNullOrEmptyString(data?.userId)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.Invalid_User_Id);
    }

    const user: User | null = await this._userRepository.getByUuid(data.userId);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist);
    }

    const token = await this._resetPasswordTokensRepository.getLastToken(user!.id);

    if (isNullOrUndefined(token) || this._resetPasswordTokensRepository.isTokenExpired(token) || token!.token !== data.token) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Reset_Password_Token);
    }

    await this._userRepository.setPassword(user!.id, data.password!);

    await this._resetPasswordTokensRepository.deleteTokens(user!.id);

    this._eventDispatcher.dispatch(events.users.userPasswordChanged, new UserPasswordChangedEvent(userToIUser(user!)));

    return {
      isPasswordSet: true,
    } satisfies ResetPasswordResultDto;
  }

  public async login(data: LoginDto): Promise<ILoginResult> {
    if (isNullOrEmptyString(data?.email) || isNullOrEmptyString(data?.password)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const users: User[] = await this._userRepository.findManyByLogin(data.email, data.phone);

    if (users?.length !== 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    }

    const user: User = users[0];

    if (isNullOrEmptyString(user.password)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.User_Password_Is_Not_Set);
    }

    const userDto = userToIUser(user);

    if (!user.isActive) {
      this._eventDispatcher.dispatch(events.users.inactiveUserTriesToLogIn, new InactiveUserTriesToLogInEvent(userDto));
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.User_Is_Not_Active);
    }

    if (user.isLockedOut) {
      this._eventDispatcher.dispatch(events.users.lockedUserTriesToLogIn, new LockedUserTriesToLogInEvent(userDto));
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.User_Is_Locked_Out);
    }

    const isPasswordMatching: boolean = this._passwordService.passwordMatches(data.password ?? '', user.salt, user.password!);

    if (!isPasswordMatching) {
      const failedLoginAttempts = await this._userRepository.increaseFailedLoginAttempts(user.id, user.failedLoginAttempts);

      this._eventDispatcher.dispatch(events.users.failedLoginAttempt, new FailedLoginAttemptEvent(userDto));

      if (failedLoginAttempts >= USER_ACCOUNT_LOCKOUT_SETTINGS.FAILED_LOGIN_ATTEMPTS) {
        await this._userRepository.lockOut(user.id);

        this._eventDispatcher.dispatch(events.users.userLockedOut, new UserLockedOutEvent(userDto));
      }

      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.login.Invalid_Login_Or_Password);
    } else {
      await this._userRepository.updateAfterLogin(user.id);
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
      (err: VerifyErrors | null, decoded): void => {
        if (!isNullOrUndefined(err)) {
          throw new TranslatableHttpException(StatusCode.ClientErrorLoginTimeOut, errorKeys.login.Refresh_Token_Expired);
        }
      },
    );

    const userPermissions = await this._permissionRepository.getUserPermissions(user!.id);
    const accessToken = this.createAccessToken(user!, userPermissions);

    this._eventDispatcher.dispatch(events.users.userRefreshedToken, new UserRefreshedTokenEvent(userToIUser(user!)));

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

  private createAccessToken(user: User, permissions: SystemPermission[]): string {
    const dataStoredInToken = {
      permissions,
      userName: user.firstName + ' ' + user.lastName,
    } satisfies DataStoredInToken;

    return sign(dataStoredInToken, getAccessTokenSecret(), {
      expiresIn: '1m',
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
