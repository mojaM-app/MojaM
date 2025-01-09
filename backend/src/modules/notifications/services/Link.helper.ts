import { CLIENT_APP_URL } from '@config';
import { AuthRoute } from '@modules/auth';

export class LinkHelper {
  public static activateAccountLink(uuid: string): string {
    throw new Error('Method not implemented.');
  }

  public static resetPasswordLink(userUuid: string, resetPasswordToken: string): string {
    const url = LinkHelper.getClientAppUrl();
    return `${url}/${AuthRoute.resetPassword}/${userUuid}/${resetPasswordToken}`;
  }

  private static getClientAppUrl(): string {
    return CLIENT_APP_URL!.endsWith('/') ? CLIENT_APP_URL!.slice(0, -1) : CLIENT_APP_URL!;
  }
}
