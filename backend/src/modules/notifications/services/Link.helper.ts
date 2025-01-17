import { CLIENT_APP_URL } from '@config';
import { AuthRoute } from '@modules/auth';

export class LinkHelper {
  public static activateAccountLink(userUuid: string): string {
    return `${LinkHelper.getClientAppUrl()}/account/${userUuid}/activate?t=${new Date().getTime()}`;
  }

  public static resetPasswordLink(userUuid: string, resetPasswordToken: string): string {
    return `${LinkHelper.getClientAppUrl()}/${AuthRoute.resetPassword}/${userUuid}/${resetPasswordToken}`;
  }

  private static getClientAppUrl(): string {
    return CLIENT_APP_URL!.endsWith('/') ? CLIENT_APP_URL!.slice(0, -1) : CLIENT_APP_URL!;
  }
}
