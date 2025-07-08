import { BaseController } from '@core';
import { errorKeys } from '@exceptions';
import { isGuid } from '@utils';
import { type NextFunction, type Request, type Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import {
  type ActivateAccountDto,
  ActivateAccountReqDto,
  ActivateAccountResponseDto,
  type IActivateAccountResultDto,
} from '../dtos/activate-account.dto';
import {
  CheckResetPasscodeTokenReqDto,
  CheckResetPasscodeTokenResponseDto,
  type ICheckResetPasscodeTokenResultDto,
} from '../dtos/check-reset-passcode-token.dto';
import {
  type AccountTryingToLogInDto,
  GetAccountBeforeLogInResponseDto,
  type IGetAccountBeforeLogInResultDto,
} from '../dtos/get-account-before-log-in.dto';
import {
  GetAccountToActivateReqDto,
  GetAccountToActivateResponseDto,
  type IAccountToActivateResultDto,
} from '../dtos/get-account-to-activate.dto';
import { type LoginDto, LoginResponseDto } from '../dtos/login.dto';
import { type RefreshTokenDto, RefreshTokenResponseDto } from '../dtos/refresh-token.dto';
import { RequestResetPasscodeResponseDto } from '../dtos/request-reset-passcode.dto';
import {
  type IResetPasscodeResultDto,
  type ResetPasscodeDto,
  ResetPasscodeReqDto,
  ResetPasscodeResponseDto,
} from '../dtos/reset-passcode.dto';
import {
  type IUnlockAccountResultDto,
  UnlockAccountReqDto,
  UnlockAccountResponseDto,
} from '../dtos/unlock-account.dto';
import type { ILoginResult } from '../interfaces/login.interfaces';
import { AccountService } from '../services/account.service';
import { AuthService } from '../services/auth.service';
import { ResetPasscodeService } from '../services/reset-passcode.service';
import { SecurityLoggerService } from './../../../core/logger/security-logger.service';

export class AuthController extends BaseController {
  private readonly _authService: AuthService;
  private readonly _accountService: AccountService;
  private readonly _resetPasscodeService: ResetPasscodeService;
  private readonly _securityLoggerService: SecurityLoggerService;

  constructor() {
    super();
    this._authService = Container.get(AuthService);
    this._accountService = Container.get(AccountService);
    this._resetPasscodeService = Container.get(ResetPasscodeService);
    this._securityLoggerService = Container.get(SecurityLoggerService);
  }

  public getAccountBeforeLogIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: AccountTryingToLogInDto = req.body;
      const result: IGetAccountBeforeLogInResultDto = await this._accountService.getAccountBeforeLogIn(model);
      res.status(StatusCode.SuccessOK).json(new GetAccountBeforeLogInResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
  public requestResetPasscode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: AccountTryingToLogInDto = req.body;

      this._securityLoggerService.logPasswordReset({
        req,
        email: model.email || 'unknown',
        phone: model.phone || undefined,
      });

      const result = await this._resetPasscodeService.requestResetPasscode(model);
      res.status(StatusCode.SuccessOK).json(new RequestResetPasscodeResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public checkResetPasscodeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params.userId) ? req.params.userId : undefined;
      const token = req.params.token.length > 0 ? req.params.token : undefined;
      const reqDto = new CheckResetPasscodeTokenReqDto(userGuid, token);
      const result: ICheckResetPasscodeTokenResultDto =
        await this._resetPasscodeService.checkResetPasscodeToken(reqDto);
      res.status(StatusCode.SuccessOK).json(new CheckResetPasscodeTokenResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public resetPasscode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params.userId) ? req.params.userId : undefined;
      const model: ResetPasscodeDto = req.body;
      const result: IResetPasscodeResultDto = await this._resetPasscodeService.resetPasscode(
        new ResetPasscodeReqDto(userGuid, model),
      );
      res.status(StatusCode.SuccessOK).json(new ResetPasscodeResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const model: LoginDto = req.body;
    try {
      const result: ILoginResult = await this._authService.login(model);

      this._securityLoggerService.logSuccessfulLogin({
        req,
        userId: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
      });

      res.status(StatusCode.SuccessOK).json(new LoginResponseDto(result));
    } catch (error) {
      this._securityLoggerService.logFailedLogin({
        req,
        email: model.email || undefined,
        phone: model.phone || undefined,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof Error && error.message === errorKeys.login.Account_Is_Locked_Out) {
        this._securityLoggerService.logAccountLockout({
          req,
          userId: undefined,
          email: model.email || undefined,
          phone: model.phone || undefined,
        });
      }

      next(error);
    }
  };

  public refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: RefreshTokenDto = req.body;
      const result: string | null = await this._authService.refreshAccessToken(model);
      res.status(StatusCode.SuccessOK).json(new RefreshTokenResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public getAccountToActivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params.userId) ? req.params.userId : undefined;
      const reqDto = new GetAccountToActivateReqDto(userGuid);
      const result: IAccountToActivateResultDto = await this._accountService.getAccountToActivate(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetAccountToActivateResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public activateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params.userId) ? req.params.userId : undefined;
      const model: ActivateAccountDto = req.body;
      const result: IActivateAccountResultDto = await this._accountService.activateAccount(
        new ActivateAccountReqDto(userGuid, model),
      );
      res.status(StatusCode.SuccessOK).json(new ActivateAccountResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public unlockAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params.userId) ? req.params.userId : undefined;
      const result: IUnlockAccountResultDto = await this._accountService.unlockAccount(
        new UnlockAccountReqDto(userGuid),
      );
      res.status(StatusCode.SuccessOK).json(new UnlockAccountResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  // public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: IUserDto = req.user;
  //     const logOutUserData: IUserDto = await this.authService.logout(userData);

  //     res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
  //     res.status(StatusCode.SuccessOK).json({ data: logOutUserData, message: 'logout' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}
