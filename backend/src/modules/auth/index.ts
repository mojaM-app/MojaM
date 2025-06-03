export { FailedLoginAttemptEvent } from './events/failed-login-attempt-event';
export { InactiveUserTriesToLogInEvent } from './events/inactive-user-tries-to-log-in-event';
export { LockedUserTriesToLogInEvent } from './events/locked-user-tries-to-log-in-event';
export { UserLockedOutEvent } from './events/user-locked-out-event';
export { UserLoggedInEvent } from './events/user-logged-in-event';
export { UserPasscodeChangedEvent } from './events/user-passcode-changed-event';
export { UserRefreshedTokenEvent } from './events/user-refreshed-token-event';

export { LoginResponseDto } from './dtos/login.dto';
export { GetAccountBeforeLogInResponseDto, IGetAccountBeforeLogInResultDto } from './dtos/get-account-before-log-in.dto';

export { AuthRoute } from './routes/auth.routes';

export { PasswordService } from './services/password.service';
export { PinService } from './services/pin.service';

// Module self-registration
import { AuthModuleBoundary } from './auth-module.boundary';
import { ModuleRegistry } from '../../core/di/module-registry';

ModuleRegistry.addModuleRegistration(() => {
  ModuleRegistry.registerAuthModule(AuthModuleBoundary);
});
