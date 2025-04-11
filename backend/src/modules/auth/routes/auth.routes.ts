import { REGEX_PATTERNS } from '@config';
import { IRoutes } from '@interfaces';
import { validateData } from '@middlewares';
import { AccountTryingToLogInDto, ActivateAccountDto, AuthController, LoginDto, RefreshTokenDto, ResetPasscodeDto } from '@modules/auth';
import express from 'express';

export class AuthRoute implements IRoutes {
  public static resetPasscode: string = 'reset-passcode';
  public path = '/auth';
  public loginPath = '/login';
  public getAccountBeforeLogInPath = `${this.path}/get-account-before-log-in`;
  public requestResetPasscodePath = `${this.path}/request-reset-passcode`;
  public checkResetPasscodeTokenPath = `${this.path}/check-reset-passcode-token`;
  public resetPasscodePath = `${this.path}/${AuthRoute.resetPasscode}`;
  public refreshTokenPath = `${this.path}/refresh-token`;
  public getAccountToActivatePath = `${this.path}/get-account-to-activate`;
  public activateAccountPath = `${this.path}/activate-account`;
  public unlockAccountPath = `${this.path}/unlock-account`;
  public router = express.Router();

  private readonly _authController: AuthController;

  public constructor() {
    this._authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(this.loginPath, [validateData(LoginDto)], this._authController.logIn);
    this.router.post(this.getAccountBeforeLogInPath, [validateData(AccountTryingToLogInDto)], this._authController.getAccountBeforeLogIn);
    this.router.post(this.requestResetPasscodePath, [validateData(AccountTryingToLogInDto)], this._authController.requestResetPasscode);
    this.router.post(this.checkResetPasscodeTokenPath + `/:userId(${REGEX_PATTERNS.GUID})/:token`, this._authController.checkResetPasscodeToken);
    this.router.post(
      this.resetPasscodePath + `/:userId(${REGEX_PATTERNS.GUID})`,
      [validateData(ResetPasscodeDto)],
      this._authController.resetPasscode,
    );
    this.router.post(this.refreshTokenPath, [validateData(RefreshTokenDto)], this._authController.refreshAccessToken);
    this.router.post(this.getAccountToActivatePath + `/:userId(${REGEX_PATTERNS.GUID})`, this._authController.getAccountToActivate);
    this.router.post(
      this.activateAccountPath + `/:userId(${REGEX_PATTERNS.GUID})`,
      [validateData(ActivateAccountDto)],
      this._authController.activateAccount,
    );
    this.router.post(this.unlockAccountPath + `/:userId(${REGEX_PATTERNS.GUID})`, this._authController.unlockAccount);

    // this.router.post(`${this.path}logout`, verifyToken, this._authController.logOut);
  }
}
