import { DatabaseLoggerService, events, IUnlockAccountEmailSettings, LinkHelper } from '@core';
import { UserLockedOutEvent } from '@modules/auth';
import { EventSubscriber, On } from 'event-dispatch';
import { Container } from 'typedi';
import { EmailService } from '../services/email.service';

@EventSubscriber()
export class UserLockedOutEventSubscriber {
  private readonly _databaseLoggerService: DatabaseLoggerService;

  constructor() {
    this._databaseLoggerService = Container.get(DatabaseLoggerService);
  }

  @On(events.users.userLockedOut)
  public eventHandler(data: UserLockedOutEvent): void {
    const emailService = Container.get(EmailService);

    emailService
      .sendUnlockAccountEmail({
        user: data.user,
        link: LinkHelper.unlockAccountLink(data.user.uuid),
        lockDateTime: new Date(),
      } satisfies IUnlockAccountEmailSettings)
      .then((success: boolean) => {
        if (success) {
          this._databaseLoggerService.debug(`Unlock account email sent to '${data.user.email}'`);
        }
      })
      .catch((error: Error) => {
        this._databaseLoggerService.error(`Failed to send unlock account email to ${data.user.email}`, error);
      });
  }
}
