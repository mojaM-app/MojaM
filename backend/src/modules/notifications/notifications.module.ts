import { IModule, INotificationsService, IResetPasscodeEmailSettings, IRoutes } from '@core';
import Container from 'typedi';
import { EmailService } from './services/email.service';

export class NotificationsModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [];
  }

  public register(): void {
    Container.set<INotificationsService>('INotificationsService', {
      sendEmailResetPasscode(settings: IResetPasscodeEmailSettings): Promise<boolean> {
        const service = Container.get(EmailService);
        return service.sendEmailResetPasscode(settings);
      },
    } satisfies INotificationsService);
  }
}
