import { REGEX_PATTERNS } from '@config';
import { type IRoutes, RouteConstants } from '@core';
import { validateData } from '@middlewares';
import { default as express } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ActivateAccountDto } from '../dtos/activate-account.dto';
import { AccountTryingToLogInDto } from '../dtos/get-account-before-log-in.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ResetPasscodeDto } from '../dtos/reset-passcode.dto';

export class AuthRoute implements IRoutes {
  public static loginPath = '/login';
  public static getAccountBeforeLogInPath = '/auth/get-account-before-log-in';
  public static requestResetPasscodePath = '/auth/request-reset-passcode';
  public static checkResetPasscodeTokenPath = '/auth/check-reset-passcode-token';
  public static resetPasscodePath = `/auth/${RouteConstants.AUTH_RESET_PASSCODE}`;
  public static refreshTokenPath = '/auth/refresh-token';
  public static getAccountToActivatePath = '/auth/get-account-to-activate';
  public static activateAccountPath = `/auth/activate-account`;
  public static unlockAccountPath = `/auth/unlock-account`;
  public router = express.Router();

  private readonly _authController: AuthController;

  constructor() {
    this._authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(AuthRoute.loginPath, [validateData(LoginDto)], this._authController.logIn);

    this.router.post(
      AuthRoute.getAccountBeforeLogInPath,
      [validateData(AccountTryingToLogInDto)],
      this._authController.getAccountBeforeLogIn,
    );

    this.router.post(
      AuthRoute.requestResetPasscodePath,
      [validateData(AccountTryingToLogInDto)],
      this._authController.requestResetPasscode,
    );

    this.router.post(
      `${AuthRoute.checkResetPasscodeTokenPath}/:userId(${REGEX_PATTERNS.GUID})/:token`,
      this._authController.checkResetPasscodeToken,
    );

    this.router.post(
      `${AuthRoute.resetPasscodePath}/:userId(${REGEX_PATTERNS.GUID})`,
      [validateData(ResetPasscodeDto)],
      this._authController.resetPasscode,
    );

    this.router.post(
      AuthRoute.refreshTokenPath,
      [validateData(RefreshTokenDto)],
      this._authController.refreshAccessToken,
    );

    this.router.post(
      `${AuthRoute.getAccountToActivatePath}/:userId(${REGEX_PATTERNS.GUID})`,
      this._authController.getAccountToActivate,
    );

    this.router.post(
      `${AuthRoute.activateAccountPath}/:userId(${REGEX_PATTERNS.GUID})`,
      [validateData(ActivateAccountDto)],
      this._authController.activateAccount,
    );

    this.router.post(
      `${AuthRoute.unlockAccountPath}/:userId(${REGEX_PATTERNS.GUID})`,
      this._authController.unlockAccount,
    );

    // this.router.post(`${AuthRoute.path}logout`, verifyToken, this._authController.logOut);
  }
}
