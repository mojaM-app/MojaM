import { Container, Service } from 'typedi';
import {
  BaseService,
  events,
  INotificationsService,
  IResetPasscodeEmailSettings,
  IUserEntity,
  IUserService,
  LinkHelper,
} from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { CryptoService } from './crypto.service';
import { PasscodeService } from './passcode.service';
import {
  CheckResetPasscodeTokenReqDto,
  ICheckResetPasscodeTokenResultDto,
} from '../dtos/check-reset-passcode-token.dto';
import { AccountTryingToLogInDto } from '../dtos/get-account-before-log-in.dto';
import { IResetPasscodeResultDto, ResetPasscodeReqDto } from '../dtos/reset-passcode.dto';
import { UserPasscodeChangedEvent } from '../events/user-passcode-changed-event';
import { getAuthenticationType } from '../helpers/auth.helper';
import { ResetPasscodeTokensRepository } from '../repositories/reset-passcode-tokens.repository';

@Service()
export class ResetPasscodeService extends BaseService {
  private readonly _userService: IUserService;
  private readonly _notificationsService: INotificationsService;

  constructor(
    private readonly _resetPasscodeTokensRepository: ResetPasscodeTokensRepository,
    private readonly _passcodeService: PasscodeService,
    private readonly _cryptoService: CryptoService,
  ) {
    super();
    this._userService = Container.get<IUserService>('IUserService');
    this._notificationsService = Container.get<INotificationsService>('INotificationsService');
  }

  public async requestResetPasscode(data: AccountTryingToLogInDto): Promise<boolean> {
    const users: IUserEntity[] = await this._userService.findManyByLogin(data.email, data.phone);

    if (users.length !== 1) {
      return true;
    }

    const [user] = users;
    const authType = getAuthenticationType(user);
    if (
      isNullOrEmptyString(user.passcode) ||
      authType === undefined ||
      !(await this._resetPasscodeTokensRepository.isLastTokenExpired(user.id))
    ) {
      return true;
    }

    await this._resetPasscodeTokensRepository.deleteTokens(user.id);

    const token = this._cryptoService.generateResetPasscodeToken();
    const resetPasscodeToken = await this._resetPasscodeTokensRepository.createToken(user.id, token);

    return await this._notificationsService.sendEmailResetPasscode({
      user,
      authType,
      link: LinkHelper.resetPasscodeLink(user.uuid, resetPasscodeToken.token),
    } satisfies IResetPasscodeEmailSettings);
  }

  public async checkResetPasscodeToken(
    data: CheckResetPasscodeTokenReqDto,
  ): Promise<ICheckResetPasscodeTokenResultDto> {
    const userId = await this._userService.getIdByUuid(data.userGuid);

    if (isNullOrUndefined(userId)) {
      return {
        isValid: false,
      } satisfies ICheckResetPasscodeTokenResultDto;
    }

    const token = await this._resetPasscodeTokensRepository.getLastToken(userId!);

    if (
      isNullOrUndefined(token) ||
      this._resetPasscodeTokensRepository.isTokenExpired(token) ||
      token!.token !== data.token
    ) {
      return {
        isValid: false,
      } satisfies ICheckResetPasscodeTokenResultDto;
    }

    const user = await this._userService.getById(userId);

    return {
      isValid: true,
      userEmail: user?.email,
      authType: getAuthenticationType(user! as any),
    } satisfies ICheckResetPasscodeTokenResultDto;
  }

  public async resetPasscode(data: ResetPasscodeReqDto): Promise<IResetPasscodeResultDto> {
    if (isNullOrEmptyString(data.userGuid)) {
      throw new BadRequestException(errorKeys.users.Invalid_User_Id);
    }

    if (isNullOrEmptyString(data.model?.token)) {
      throw new BadRequestException(errorKeys.login.Invalid_Reset_Passcode_Token);
    }

    const user: IUserEntity | null = await this._userService.getByUuid(data.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.Invalid_User_Id);
    }

    const token = await this._resetPasscodeTokensRepository.getLastToken(user!.id);

    if (
      isNullOrUndefined(token) ||
      this._resetPasscodeTokensRepository.isTokenExpired(token) ||
      token!.token !== data.model!.token
    ) {
      throw new BadRequestException(errorKeys.login.Invalid_Reset_Passcode_Token);
    }

    if (this._passcodeService.isValid(data.model?.passcode)) {
      await this._userService.setPasscode(user!.id, data.model!.passcode);
    } else {
      throw new BadRequestException(errorKeys.users.Invalid_Passcode);
    }

    if (!user!.isActive) {
      await this._userService.activate(user!.id);
    }

    if (user!.isLockedOut) {
      await this._userService.unlock(user!.id);
    }

    await this._resetPasscodeTokensRepository.deleteTokens(user!.id);

    this._eventDispatcher.dispatch(events.users.userPasscodeChanged, new UserPasscodeChangedEvent(user!));

    return {
      isPasscodeSet: true,
    } satisfies IResetPasscodeResultDto;
  }
}
