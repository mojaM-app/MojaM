import { events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import {
  AccountTryingToLogInDto,
  CheckResetPasscodeTokenReqDto,
  CryptoService,
  ICheckResetPasscodeTokenResultDto,
  IResetPasscodeResultDto,
  PasscodeService,
  ResetPasscodeReqDto,
  UserPasscodeChangedEvent,
} from '@modules/auth';
import { BaseService } from '@modules/common';
import { EmailService, IResetPasscodeEmailSettings, LinkHelper } from '@modules/notifications';
import { UserRepository } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { Container, Service } from 'typedi';
import { getAuthenticationType } from '../helpers/auth.helper';
import { ResetPasscodeTokensRepository } from '../repositories/reset-passcode-tokens.repository';

@Service()
export class ResetPasscodeService extends BaseService {
  private readonly _userRepository: UserRepository;
  private readonly _resetPasscodeTokensRepository: ResetPasscodeTokensRepository;
  private readonly _cryptoService: CryptoService;
  private readonly _passcodeService: PasscodeService;
  private readonly _emailService: EmailService;

  public constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
    this._resetPasscodeTokensRepository = Container.get(ResetPasscodeTokensRepository);
    this._cryptoService = Container.get(CryptoService);
    this._emailService = Container.get(EmailService);
    this._passcodeService = Container.get(PasscodeService);
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

    if (user!.isLockedOut) {
      await this._userRepository.unlock(user!.id);
    }

    await this._resetPasscodeTokensRepository.deleteTokens(user!.id);

    this._eventDispatcher.dispatch(events.users.userPasscodeChanged, new UserPasscodeChangedEvent(user!));

    return {
      isPasscodeSet: true,
    } satisfies IResetPasscodeResultDto;
  }
}
