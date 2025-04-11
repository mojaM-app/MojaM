import { CLIENT_APP_URL } from '@config';
import { AuthRoute } from '@modules/auth';

export class LinkHelper {
  public static activateAccountLink(userUuid: string): string {
    const token = encodeURIComponent(btoa(new Date().getTime().toString()));
    return `${LinkHelper.getClientAppUrl()}/account/${userUuid}/activate/${token}`;
  }

  public static resetPasscodeLink(userUuid: string, token: string): string {
    return `${LinkHelper.getClientAppUrl()}/account/${userUuid}/${AuthRoute.resetPasscode}/${token}`;
  }

  public static unlockAccountLink(userUuid: string): string {
    const token = encodeURIComponent(btoa(new Date().getTime().toString()));
    return `${LinkHelper.getClientAppUrl()}/account/${userUuid}/unlock/${token}`;
  }

  private static getClientAppUrl(): string {
    return CLIENT_APP_URL!.endsWith('/') ? CLIENT_APP_URL!.slice(0, -1) : CLIENT_APP_URL!;
  }
}
