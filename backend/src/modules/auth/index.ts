export { FailedLoginAttemptEvent } from './events/failed-login-attempt-event';
export { InactiveUserTriesToLogInEvent } from './events/inactive-user-tries-to-log-in-event';
export { LockedUserTriesToLogInEvent } from './events/locked-user-tries-to-log-in-event';
export { UserLockedOutEvent } from './events/user-locked-out-event';
export { UserLoggedInEvent } from './events/user-logged-in-event';
export { UserPasscodeChangedEvent } from './events/user-passcode-changed-event';
export { UserRefreshedTokenEvent } from './events/user-refreshed-token-event';

export { ActivateAccountDto, ActivateAccountReqDto, ActivateAccountResponseDto, type IActivateAccountResultDto } from './dtos/activate-account.dto';
export {
  CheckResetPasscodeTokenReqDto,
  CheckResetPasscodeTokenResponseDto,
  type ICheckResetPasscodeTokenResultDto,
} from './dtos/check-reset-passcode-token.dto';
export {
  AccountTryingToLogInDto,
  GetAccountBeforeLogInResponseDto,
  type IGetAccountBeforeLogInResultDto,
} from './dtos/get-account-before-log-in.dto';
export { GetAccountToActivateReqDto, GetAccountToActivateResponseDto, type IAccountToActivateResultDto } from './dtos/get-account-to-activate.dto';
export { LoginDto, LoginResponseDto } from './dtos/login.dto';
export { RefreshTokenDto, RefreshTokenResponseDto } from './dtos/refresh-token.dto';
export { RequestResetPasscodeResponseDto } from './dtos/request-reset-passcode.dto';
export { ResetPasscodeDto, ResetPasscodeReqDto, ResetPasscodeResponseDto, type IResetPasscodeResultDto } from './dtos/reset-passcode.dto';

export type { IDataStoredInToken } from './interfaces/data-stored-in-token.interface';
export { Identity } from './models/Identity';

export type { ILoginResult } from './interfaces/login.interfaces';
export type { TLoginResult } from './types/login.types';

export { AuthController } from './controllers/auth.controller';
export { ResetPasscodeTokensRepository } from './repositories/reset-passcode-tokens.repository';
export { AuthRoute } from './routes/auth.routes';
export { AuthService } from './services/auth.service';
export { CryptoService } from './services/crypto.service';
export { PasscodeService } from './services/passcode.service';
export { PasswordService } from './services/password.service';
export { PinService } from './services/pin.service';

export { setIdentity } from './middlewares/set-identity.middleware';

export { AuthenticationTypes } from './enums/authentication-type.enum';
