import { USER_ACCOUNT_LOCKOUT_SETTINGS } from '@config';
import { events } from '@events';
import { BadRequestException, errorKeys, TranslatableHttpException } from '@exceptions';
import {
  AccountTryingToLogInDto,
  ActivateAccountDto,
  ActivateAccountReqDto,
  CheckResetPasscodeTokenReqDto,
  CryptoService,
  FailedLoginAttemptEvent,
  GetAccountToActivateReqDto,
  IAccountToActivateResultDto,
  IActivateAccountResultDto,
  ICheckResetPasscodeTokenResultDto,
  IDataStoredInToken,
  IGetAccountBeforeLogInResultDto,
  ILoginResult,
  InactiveUserTriesToLogInEvent,
  IResetPasscodeResultDto,
  LockedUserTriesToLogInEvent,
  LoginDto,
  PasscodeService,
  RefreshTokenDto,
  ResetPasscodeReqDto,
  UserLockedOutEvent,
  UserLoggedInEvent,
  UserPasscodeChangedEvent,
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
import { BaseService, userToIUser } from '@modules/common';
import { EmailService, IResetPasscodeEmailSettings, LinkHelper } from '@modules/notifications';
import { UserPermissionsRepository } from '@modules/permissions';
import { UpdateUserModel, UserActivatedEvent, UserRepository } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';
import { IUpdateUser } from '@modules/users/interfaces/update-user.interfaces';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { decode, JwtPayload, sign, verify, VerifyErrors } from 'jsonwebtoken';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';
import { AuthenticationTypes } from '../enums/authentication-type.enum';
import { getAuthenticationType } from '../helpers/auth.helper';
import { ResetPasscodeTokensRepository } from '../repositories/reset-passcode-tokens.repository';

@Service()
export class AuthService extends BaseService {
  private readonly _userRepository: UserRepository;
  private readonly _permissionRepository: UserPermissionsRepository;
  private readonly _resetPasscodeTokensRepository: ResetPasscodeTokensRepository;
  private readonly _cryptoService: CryptoService;
  private readonly _passcodeService: PasscodeService;
  private readonly _emailService: EmailService;

  public constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
    this._permissionRepository = Container.get(UserPermissionsRepository);
    this._resetPasscodeTokensRepository = Container.get(ResetPasscodeTokensRepository);
    this._cryptoService = Container.get(CryptoService);
    this._emailService = Container.get(EmailService);
    this._passcodeService = Container.get(PasscodeService);
  }

  public async getAccountBeforeLogIn(data: AccountTryingToLogInDto): Promise<IGetAccountBeforeLogInResultDto> {
    const users: User[] = await this._userRepository.findManyByLogin(data?.email, data?.phone);

    if ((users?.length ?? 0) === 0) {
      return {
        authType: AuthenticationTypes.Password,
        isActive: true,
      } satisfies IGetAccountBeforeLogInResultDto;
    }

    if (users.length > 1) {
      return {
        isPhoneRequired: true,
      } satisfies IGetAccountBeforeLogInResultDto;
    }

    const user = users[0];

    return {
      authType: getAuthenticationType(user),
      isActive: user.isActive,
    } satisfies IGetAccountBeforeLogInResultDto;
  }

  public async requestResetPasscode(data: AccountTryingToLogInDto): Promise<boolean> {
    const users: User[] = await this._userRepository.findManyByLogin(data?.email, data?.phone);

    if ((users?.length ?? 0) !== 1) {
      return true;
    }

    const user = users[0];
    const authType = getAuthenticationType(user);
    if (isNullOrEmptyString(user.passcode) || authType === undefined || !(await this._resetPasscodeTokensRepository.isLastTokenExpired(user.id))) {
      return true;
    }

    await this._resetPasscodeTokensRepository.deleteTokens(user.id);

    const token = this._cryptoService.generateResetPasscodeToken();

    const resetPasscodeToken = await this._resetPasscodeTokensRepository.createToken(user.id, token);

    return await this._emailService.sendEmailResetPasscode({
      user,
      authType,
      link: LinkHelper.resetPasscodeLink(user.uuid, resetPasscodeToken.token),
    } satisfies IResetPasscodeEmailSettings);
  }

  public async checkResetPasscodeToken(data: CheckResetPasscodeTokenReqDto): Promise<ICheckResetPasscodeTokenResultDto> {
    const userId = await this._userRepository.getIdByUuid(data.userGuid);

    if (isNullOrUndefined(userId)) {
      return {
        isValid: false,
      } satisfies ICheckResetPasscodeTokenResultDto;
    }

    const token = await this._resetPasscodeTokensRepository.getLastToken(userId!);

    if (isNullOrUndefined(token) || this._resetPasscodeTokensRepository.isTokenExpired(token) || token!.token !== data.token) {
      return {
        isValid: false,
      } satisfies ICheckResetPasscodeTokenResultDto;
    }

    const user = await this._userRepository.getById(userId);

    return {
      isValid: true,
      userEmail: user?.email,
      authType: getAuthenticationType(user!),
    } satisfies ICheckResetPasscodeTokenResultDto;
  }

  public async resetPasscode(data: ResetPasscodeReqDto): Promise<IResetPasscodeResultDto> {
    if (isNullOrEmptyString(data.userGuid)) {
      throw new BadRequestException(errorKeys.users.Invalid_User_Id);
    }

    if (isNullOrEmptyString(data.model?.token)) {
      throw new BadRequestException(errorKeys.login.Invalid_Reset_Passcode_Token);
    }

    const user: User | null = await this._userRepository.getByUuid(data.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.Invalid_User_Id);
    }

    const token = await this._resetPasscodeTokensRepository.getLastToken(user!.id);

    if (isNullOrUndefined(token) || this._resetPasscodeTokensRepository.isTokenExpired(token) || token!.token !== data.model!.token) {
      throw new BadRequestException(errorKeys.login.Invalid_Reset_Passcode_Token);
    }

    if (this._passcodeService.isValid(data.model?.passcode)) {
      await this._userRepository.setPasscode(user!.id, data.model!.passcode);
    } else {
      throw new BadRequestException(errorKeys.users.Invalid_Passcode);
    }

    if (!user!.isActive) {
      await this._userRepository.activate(user!.id);
    }

    await this._resetPasscodeTokensRepository.deleteTokens(user!.id);

    this._eventDispatcher.dispatch(events.users.userPasscodeChanged, new UserPasscodeChangedEvent(user!));

    return {
      isPasscodeSet: true,
    } satisfies IResetPasscodeResultDto;
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
      throw new BadRequestException(errorKeys.login.User_Is_Locked_Out);
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
      (err: VerifyErrors | null, decoded): void => {
        if (!isNullOrUndefined(err)) {
          throw new TranslatableHttpException(StatusCode.ClientErrorLoginTimeOut, errorKeys.login.Refresh_Token_Expired);
        }
      },
    );

    const accessToken = await this.createAccessTokenAsync(user!);

    this._eventDispatcher.dispatch(events.users.userRefreshedToken, new UserRefreshedTokenEvent(user!));

    return accessToken;
  }

  public async getAccountToActivate(data: GetAccountToActivateReqDto): Promise<IAccountToActivateResultDto> {
    const result = {
      isActive: true,
    } satisfies IAccountToActivateResultDto;

    const user = await this._userRepository.getByUuid(data.userGuid);

    if (isNullOrUndefined(user)) {
      return result;
    }

    if (user!.isActive) {
      return result;
    }

    if (user!.isLockedOut) {
      return {
        isActive: user!.isActive,
        isLockedOut: user!.isLockedOut,
      } satisfies IAccountToActivateResultDto;
    }

    return {
      email: user!.email,
      phone: user!.phone,
      joiningDate: user!.joiningDate,
      firstName: user!.firstName,
      lastName: user!.lastName,
      isActive: user!.isActive,
      isLockedOut: user!.isLockedOut,
    } satisfies IAccountToActivateResultDto;
  }

  public async activateAccount(reqDto: ActivateAccountReqDto): Promise<IActivateAccountResultDto> {
    const user: User | null = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      return {
        isActive: true,
      } satisfies IActivateAccountResultDto;
    }

    const userData: ActivateAccountDto = reqDto.model!;

    if (!isNullOrEmptyString(userData.passcode)) {
      await this._userRepository.setPasscode(user!.id, userData.passcode!);
    }

    if (!user!.isActive) {
      await this._userRepository.activate(user!.id);
    }

    const model = new UpdateUserModel(user!.id, {
      firstName: userData.firstName,
      lastName: userData.lastName,
      joiningDate: userData.joiningDate,
    } satisfies IUpdateUser) satisfies UpdateUserModel;
    const updatedUser = await this._userRepository.update(model);

    await this._resetPasscodeTokensRepository.deleteTokens(user!.id);

    this._eventDispatcher.dispatch(events.users.userActivated, new UserActivatedEvent(updatedUser!, undefined));

    return {
      isActive: updatedUser!.isActive,
    } satisfies IActivateAccountResultDto;
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
