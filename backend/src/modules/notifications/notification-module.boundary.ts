import { INotificationModuleBoundary, IResetPasscodeEmailSettings } from '@core';
import { Service } from 'typedi';
import { EmailService } from './services/email.service';
@Service()
export class NotificationModuleBoundary implements INotificationModuleBoundary {
  constructor(private readonly _emailService: EmailService) {}

  public async sendEmailResetPasscode(settings: IResetPasscodeEmailSettings): Promise<boolean> {
    return await this._emailService.sendEmailResetPasscode(settings);
  }
}
