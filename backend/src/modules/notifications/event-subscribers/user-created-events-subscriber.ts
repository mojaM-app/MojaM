import { logger } from '@core';
import { events } from '@events';
import { UserCreatedEvent } from '@modules/users';
import { EventSubscriber, On } from 'event-dispatch';
import Container from 'typedi';
import { LinkHelper } from '../helpers/link.helper';
import { IWelcomeEmailSettings } from '../interfaces/welcome-email-settings.interface';
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
