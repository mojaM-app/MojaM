import { REGEX_PATTERNS } from '@config';
import { IRoutes, RouteConstants } from '@core';
import { authRateLimit, passwordResetRateLimit, validateData } from '@middlewares';
import { default as express } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ActivateAccountDto } from '../dtos/activate-account.dto';
import { AccountTryingToLogInDto } from '../dtos/get-account-before-log-in.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ResetPasscodeDto } from '../dtos/reset-passcode.dto';

export class AuthRoute implements IRoutes {
  public static loginPath = RouteConstants.AUTH_LOGIN_PATH;
  public static getAccountBeforeLogInPath = RouteConstants.AUTH_GET_ACCOUNT_BEFORE_LOG_IN_PATH;
  public static requestResetPasscodePath = RouteConstants.AUTH_REQUEST_RESET_PASSCODE_PATH;
  public static checkResetPasscodeTokenPath = `${RouteConstants.AUTH_PATH}/check-reset-passcode-token`;
  public static resetPasscodePath = `${RouteConstants.AUTH_PATH}/${RouteConstants.AUTH_RESET_PASSCODE}`;
  public static refreshTokenPath = `${RouteConstants.AUTH_PATH}/refresh-token`;
  public static getAccountToActivatePath = `${RouteConstants.AUTH_PATH}/get-account-to-activate`;
  public static activateAccountPath = `${RouteConstants.AUTH_PATH}/activate-account`;
  public static unlockAccountPath = `${RouteConstants.AUTH_PATH}/unlock-account`;
  public router = express.Router();

  private readonly _authController: AuthController;

  constructor() {
    this._authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(AuthRoute.loginPath, [authRateLimit, validateData(LoginDto)], this._authController.logIn);
    this.router.post(
      AuthRoute.getAccountBeforeLogInPath,
      [authRateLimit, validateData(AccountTryingToLogInDto)],
      this._authController.getAccountBeforeLogIn,
    );
    this.router.post(
      AuthRoute.requestResetPasscodePath,
      [passwordResetRateLimit, validateData(AccountTryingToLogInDto)],
      this._authController.requestResetPasscode,
    );
    this.router.post(
      AuthRoute.checkResetPasscodeTokenPath + `/:userId(${REGEX_PATTERNS.GUID})/:token`,
      [passwordResetRateLimit],
      this._authController.checkResetPasscodeToken,
    );
    this.router.post(
      AuthRoute.resetPasscodePath + `/:userId(${REGEX_PATTERNS.GUID})`,
      [passwordResetRateLimit, validateData(ResetPasscodeDto)],
      this._authController.resetPasscode,
    );
    this.router.post(
      AuthRoute.refreshTokenPath,
      [authRateLimit, validateData(RefreshTokenDto)],
      this._authController.refreshAccessToken,
    );
    this.router.post(
      AuthRoute.getAccountToActivatePath + `/:userId(${REGEX_PATTERNS.GUID})`,
      [authRateLimit],
      this._authController.getAccountToActivate,
    );
    this.router.post(
      AuthRoute.activateAccountPath + `/:userId(${REGEX_PATTERNS.GUID})`,
      [authRateLimit, validateData(ActivateAccountDto)],
      this._authController.activateAccount,
    );
    this.router.post(
      AuthRoute.unlockAccountPath + `/:userId(${REGEX_PATTERNS.GUID})`,
      [authRateLimit],
      this._authController.unlockAccount,
    );
    // this.router.post(`${AuthRoute.path}logout`, verifyToken, this._authController.logOut);
  }
}
