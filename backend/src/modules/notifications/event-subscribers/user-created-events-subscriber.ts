import { IWelcomeEmailSettings, logger, events } from '@core';
import { UserCreatedEvent } from '@modules/users';
import { EventSubscriber, On } from 'event-dispatch';
import Container from 'typedi';
import { LinkHelper } from '../helpers/link.helper';
import { EmailService } from '../services/email.service';

@EventSubscriber()
export class UserCreatedEventSubscriber {
  @On(events.users.userCreated)
  public eventHandler(data: UserCreatedEvent): void {
    const emailService = Container.get(EmailService);

    emailService
      .sendWelcomeEmail({
        user: data.user,
        link: LinkHelper.activateAccountLink(data.user.uuid),
      } satisfies IWelcomeEmailSettings)
      .then((success: boolean) => {
        if (success) {
          logger.debug(`Welcome email sent to '${data.user.email}'`);
        }
      })
      .catch((error: Error) => {
        logger.error(`Failed to send welcome email to ${data.user.email}`, error);
      });
  }
}
