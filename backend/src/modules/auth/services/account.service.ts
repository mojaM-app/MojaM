import { IUpdateUser, IUserModuleBoundary } from '@core';
import { events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { BaseService } from '@modules/common';
import { UserActivatedEvent, UserUnlockedEvent } from '@modules/users';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { Inject, Service } from 'typedi';
import { ActivateAccountDto, ActivateAccountReqDto, IActivateAccountResultDto } from '../dtos/activate-account.dto';
import { AccountTryingToLogInDto, IGetAccountBeforeLogInResultDto } from '../dtos/get-account-before-log-in.dto';
import { GetAccountToActivateReqDto, IAccountToActivateResultDto } from '../dtos/get-account-to-activate.dto';
import { IUnlockAccountResultDto, UnlockAccountReqDto } from '../dtos/unlock-account.dto';
import { AuthenticationTypes } from '../enums/authentication-type.enum';
import { getAuthenticationType } from '../helpers/auth.helper';
import { ResetPasscodeTokensRepository } from '../repositories/reset-passcode-tokens.repository';
import { User } from './../../../dataBase/entities/users/user.entity';

@Service()
export class AccountService extends BaseService {
  constructor(
    @Inject('USER_MODULE') private readonly _userModule: IUserModuleBoundary,
    private readonly _resetPasscodeTokensRepository: ResetPasscodeTokensRepository,
  ) {
    super();
  }

  public async getAccountBeforeLogIn(data: AccountTryingToLogInDto): Promise<IGetAccountBeforeLogInResultDto> {
    const users: User[] = await this._userModule.findManyByLogin(data?.email, data?.phone);

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

  public async getAccountToActivate(data: GetAccountToActivateReqDto): Promise<IAccountToActivateResultDto> {
    const result = {
      isActive: true,
    } satisfies IAccountToActivateResultDto;

    const user = await this._userModule.getByUuid(data.userGuid);

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
    const user: User | null = await this._userModule.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      return {
        isActive: true,
      } satisfies IActivateAccountResultDto;
    }

    const userData: ActivateAccountDto = reqDto.model!;

    if (isNullOrEmptyString(userData.passcode) && !user!.isPasscodeSet()) {
      throw new BadRequestException(errorKeys.users.Activation_Failed_Passcode_Is_Not_Set);
    }

    if (!isNullOrEmptyString(userData.passcode)) {
      await this._userModule.setPasscode(user!.id, userData.passcode!);
    }

    if (!user!.isActive) {
      await this._userModule.activate(user!.id);
    }

    const updatedUser = await this._userModule.update(user!.id, {
      firstName: userData.firstName,
      lastName: userData.lastName,
      joiningDate: userData.joiningDate,
    } satisfies IUpdateUser);

    await this._resetPasscodeTokensRepository.deleteTokens(user!.id);

    this._eventDispatcher.dispatch(events.users.userActivated, new UserActivatedEvent(updatedUser!, undefined));

    return {
      isActive: updatedUser!.isActive,
    } satisfies IActivateAccountResultDto;
  }

  public async unlockAccount(reqDto: UnlockAccountReqDto): Promise<IUnlockAccountResultDto> {
    const user: User | null = await this._userModule.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user) || (!user!.isLockedOut && user!.failedLoginAttempts === 0)) {
      return {
        success: true,
      } satisfies IUnlockAccountResultDto;
    }

    const updatedUser = await this._userModule.unlock(user!.id);

    this._eventDispatcher.dispatch(events.users.userUnlocked, new UserUnlockedEvent(updatedUser!, undefined));

    return {
      success: true,
    } satisfies IUnlockAccountResultDto;
  }
}
