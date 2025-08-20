import { StatusCode } from 'status-code-enum';
import { request, type Response } from 'supertest';
import type { IAccountTryingToLogInModel, ILoginModel, TLoginResult } from '@core';
import type { ActivateAccountDto } from '@modules/auth/dtos/activate-account.dto';
import { AuthRoute } from '@modules/auth/routes/auth.routes';
import type { ITestApp } from './test-helpers.interface';

export class AuthHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async loginAs(user: {
    email?: string;
    phone?: string;
    passcode?: string | null;
  }): Promise<TLoginResult | null> {
    const loginDto = { email: user.email, phone: user.phone, passcode: user.passcode } satisfies ILoginModel;
    try {
      const loginResponse: Response = await request(this._app.getServer()).post(AuthRoute.loginPath).send(loginDto);
      const loginResult: TLoginResult =
        loginResponse.statusCode === StatusCode.SuccessOK ? loginResponse.body.data : {};
      return loginResult;
    } catch (error) {
      console.error('Error in loginAs:', error);
      return null;
    }
  }

  public async login(model: ILoginModel): Promise<Response> {
    return await request(this._app.getServer()).post(AuthRoute.loginPath).send(model);
  }

  public async getAccountBeforeLogIn(model: IAccountTryingToLogInModel): Promise<Response> {
    return await request(this._app.getServer()).post(AuthRoute.getAccountBeforeLogInPath).send(model);
  }

  public async requestResetPasscode(model: IAccountTryingToLogInModel): Promise<Response> {
    return await request(this._app.getServer()).post(AuthRoute.requestResetPasscodePath).send(model);
  }

  public async unlockAccount(userId: string): Promise<Response> {
    return await request(this._app.getServer()).post(`${AuthRoute.unlockAccountPath}/${userId}`).send();
  }

  public async activateAccount(userId: string, model: ActivateAccountDto): Promise<Response> {
    return await request(this._app.getServer()).post(`${AuthRoute.activateAccountPath}/${userId}`).send(model);
  }
}
