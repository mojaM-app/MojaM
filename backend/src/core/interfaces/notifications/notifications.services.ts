import { type IResetPasscodeEmailSettings } from './email-settings.interface';

export interface INotificationsService {
  sendEmailResetPasscode: (settings: IResetPasscodeEmailSettings) => Promise<boolean>;
}
