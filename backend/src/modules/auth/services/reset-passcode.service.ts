import { INotificationModuleBoundary, IResetPasscodeEmailSettings, IUserModuleBoundary } from '@core';
import { events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { UserPasscodeChangedEvent } from '@modules/auth';
import { BaseService } from '@modules/common';
import { LinkHelper } from '@modules/notifications';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { Inject, Service } from 'typedi';
import { PasscodeService } from './passcode.service';
import { CheckResetPasscodeTokenReqDto, ICheckResetPasscodeTokenResultDto } from '../dtos/check-reset-passcode-token.dto';
import { AccountTryingToLogInDto } from '../dtos/get-account-before-log-in.dto';
import { IResetPasscodeResultDto, ResetPasscodeReqDto } from '../dtos/reset-passcode.dto';
import { getAuthenticationType } from '../helpers/auth.helper';
import { ResetPasscodeTokensRepository } from '../repositories/reset-passcode-tokens.repository';
import { User } from './../../../dataBase/entities/users/user.entity';
import { CryptoService } from './crypto.service';

@Service()
export class ResetPasscodeService extends BaseService {
  constructor(
    @Inject('USER_MODULE') private readonly _userModule: IUserModuleBoundary,
    @Inject('NOTIFICATION_MODULE') private readonly _notificationModule: INotificationModuleBoundary,
    private readonly _resetPasscodeTokensRepository: ResetPasscodeTokensRepository,
    private readonly _passcodeService: PasscodeService,
    private readonly _cryptoService: CryptoService,
  ) {
    super();
  }

  public async requestResetPasscode(data: AccountTryingToLogInDto): Promise<boolean> {
    const users: User[] = await this._userModule.findManyByLogin(data?.email, data?.phone);

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

    return await this._notificationModule.sendEmailResetPasscode({
      user,
      authType,
      link: LinkHelper.resetPasscodeLink(user.uuid, resetPasscodeToken.token),
    } satisfies IResetPasscodeEmailSettings);
  }

  public async checkResetPasscodeToken(data: CheckResetPasscodeTokenReqDto): Promise<ICheckResetPasscodeTokenResultDto> {
    const userId = await this._userModule.getIdByUuid(data.userGuid);

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

    const user = await this._userModule.getById(userId);

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

    const user: User | null = await this._userModule.getByUuid(data.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.Invalid_User_Id);
    }

    const token = await this._resetPasscodeTokensRepository.getLastToken(user!.id);

    if (isNullOrUndefined(token) || this._resetPasscodeTokensRepository.isTokenExpired(token) || token!.token !== data.model!.token) {
      throw new BadRequestException(errorKeys.login.Invalid_Reset_Passcode_Token);
    }

    if (this._passcodeService.isValid(data.model?.passcode)) {
      await this._userModule.setPasscode(user!.id, data.model!.passcode);
    } else {
      throw new BadRequestException(errorKeys.users.Invalid_Passcode);
    }

    if (!user!.isActive) {
      await this._userModule.activate(user!.id);
    }

    if (user!.isLockedOut) {
      await this._userModule.unlock(user!.id);
    }

    await this._resetPasscodeTokensRepository.deleteTokens(user!.id);

    this._eventDispatcher.dispatch(events.users.userPasscodeChanged, new UserPasscodeChangedEvent(user!));

    return {
      isPasscodeSet: true,
    } satisfies IResetPasscodeResultDto;
  }
}
