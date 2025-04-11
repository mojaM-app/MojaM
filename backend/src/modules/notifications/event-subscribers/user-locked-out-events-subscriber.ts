import { events } from '@events';
import { UserLockedOutEvent } from '@modules/auth';
import { logger } from '@modules/logger';
import { EventSubscriber, On } from 'event-dispatch';
import Container from 'typedi';
import { IUnlockAccountEmailSettings } from '../interfaces/unlock-account-email-settings.interface';
import { EmailService } from '../services/email.service';
import { LinkHelper } from '../services/link.helper';

@EventSubscriber()
export class UserLockedOutEventSubscriber {
  private readonly _emailService: EmailService;

  public constructor() {
    this._emailService = Container.get(EmailService);
  }

  @On(events.users.userLockedOut)
  public eventHandler(data: UserLockedOutEvent): void {
    this._emailService
      .sendUnlockAccountEmail({
        user: data.user,
        link: LinkHelper.unlockAccountLink(data.user.uuid),
        lockDateTime: new Date(),
      } satisfies IUnlockAccountEmailSettings)
      .then((success: boolean) => {
        if (success) {
          logger.debug(`Unlock account email sent to '${data.user.email}'`);
        }
      })
      .catch((error: Error) => {
        logger.error(`Failed to send unlock account email to ${data.user.email}`, error);
      });
  }
}
