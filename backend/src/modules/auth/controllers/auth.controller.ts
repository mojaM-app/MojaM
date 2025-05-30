import {
  AccountService,
  AccountTryingToLogInDto,
  ActivateAccountDto,
  ActivateAccountReqDto,
  ActivateAccountResponseDto,
  AuthService,
  CheckResetPasscodeTokenReqDto,
  CheckResetPasscodeTokenResponseDto,
  GetAccountBeforeLogInResponseDto,
  GetAccountToActivateReqDto,
  GetAccountToActivateResponseDto,
  IAccountToActivateResultDto,
  IActivateAccountResultDto,
  ICheckResetPasscodeTokenResultDto,
  IGetAccountBeforeLogInResultDto,
  ILoginResult,
  IResetPasscodeResultDto,
  IUnlockAccountResultDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  RequestResetPasscodeResponseDto,
  ResetPasscodeDto,
  ResetPasscodeReqDto,
  ResetPasscodeResponseDto,
  ResetPasscodeService,
  UnlockAccountReqDto,
  UnlockAccountResponseDto,
} from '@modules/auth';
import { BaseController } from '@modules/common';
import { isGuid } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class AuthController extends BaseController {
  private readonly _authService: AuthService;
  private readonly _accountService: AccountService;
  private readonly _resetPasscodeService: ResetPasscodeService;

  constructor() {
    super();
    this._authService = Container.get(AuthService);
    this._accountService = Container.get(AccountService);
    this._resetPasscodeService = Container.get(ResetPasscodeService);
  }

  public getAccountBeforeLogIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: AccountTryingToLogInDto = req.body;
      const result: IGetAccountBeforeLogInResultDto = await this._accountService.getAccountBeforeLogIn(model);
      res.status(200).json(new GetAccountBeforeLogInResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public requestResetPasscode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: AccountTryingToLogInDto = req.body;
      const result = await this._resetPasscodeService.requestResetPasscode(model);
      res.status(200).json(new RequestResetPasscodeResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public checkResetPasscodeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params?.userId) ? req.params.userId : undefined;
      const token = req.params?.token?.length > 0 ? req.params.token : undefined;
      const reqDto = new CheckResetPasscodeTokenReqDto(userGuid, token);
      const result: ICheckResetPasscodeTokenResultDto = await this._resetPasscodeService.checkResetPasscodeToken(reqDto);
      res.status(200).json(new CheckResetPasscodeTokenResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public resetPasscode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params?.userId) ? req.params.userId : undefined;
      const model: ResetPasscodeDto = req.body;
      const result: IResetPasscodeResultDto = await this._resetPasscodeService.resetPasscode(new ResetPasscodeReqDto(userGuid, model));
      res.status(200).json(new ResetPasscodeResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: LoginDto = req.body;
      const result: ILoginResult = await this._authService.login(model);
      res.status(200).json(
        new LoginResponseDto({
          id: result.user.id,
          email: result.user.email,
          phone: result.user.phone,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }),
      );
    } catch (error) {
      next(error);
    }
  };

  public refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: RefreshTokenDto = req.body;
      const result: string | null = await this._authService.refreshAccessToken(model);
      res.status(200).json(new RefreshTokenResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public getAccountToActivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params?.userId) ? req.params.userId : undefined;
      const reqDto = new GetAccountToActivateReqDto(userGuid);
      const result: IAccountToActivateResultDto = await this._accountService.getAccountToActivate(reqDto);
      res.status(200).json(new GetAccountToActivateResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public activateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params?.userId) ? req.params.userId : undefined;
      const model: ActivateAccountDto = req.body;
      const result: IActivateAccountResultDto = await this._accountService.activateAccount(new ActivateAccountReqDto(userGuid, model));
      res.status(200).json(new ActivateAccountResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public unlockAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req.params?.userId) ? req.params.userId : undefined;
      const result: IUnlockAccountResultDto = await this._accountService.unlockAccount(new UnlockAccountReqDto(userGuid));
      res.status(200).json(new UnlockAccountResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  // public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: IUserDto = req.user;
  //     const logOutUserData: IUserDto = await this.authService.logout(userData);

  //     res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
  //     res.status(200).json({ data: logOutUserData, message: 'logout' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}
