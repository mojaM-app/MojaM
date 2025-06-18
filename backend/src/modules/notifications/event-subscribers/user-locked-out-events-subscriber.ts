import { events, IUnlockAccountEmailSettings, LinkHelper, logger } from '@core';
import { UserLockedOutEvent } from '@modules/auth';
import { EventSubscriber, On } from 'event-dispatch';
import Container from 'typedi';
import { EmailService } from '../services/email.service';

@EventSubscriber()
export class UserLockedOutEventSubscriber {
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
          logger.debug(`Unlock account email sent to '${data.user.email}'`);
        }
      })
      .catch((error: Error) => {
        logger.error(`Failed to send unlock account email to ${data.user.email}`, error);
      });
  }
}
