import { INotificationModuleBoundary } from '@core';
import { Service } from 'typedi';
import { EmailService } from './services/email.service';
import { IResetPasscodeEmailSettings } from '../../core/interfaces/notifications/reset-passcode-email-settings.interface';

@Service()
export class NotificationModuleBoundary implements INotificationModuleBoundary {
  constructor(private readonly _emailService: EmailService) {}

  public async sendEmailResetPasscode(settings: IResetPasscodeEmailSettings): Promise<boolean> {
    return await this._emailService.sendEmailResetPasscode(settings);
  }
}
