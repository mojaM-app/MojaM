import { events } from '@events';
import { logger } from '@modules/logger';
import { UserCreatedEvent } from '@modules/users';
import { EventSubscriber, On } from 'event-dispatch';
import Container from 'typedi';
import { IWelcomeEmailSettings } from '../interfaces/welcome-email-settings.interface';
import { EmailService } from '../services/email.service';
import { LinkHelper } from '../services/link.helper';

@EventSubscriber()
export class UserCreatedEventSubscriber {
  private readonly _emailService: EmailService;

  public constructor() {
    this._emailService = Container.get(EmailService);
  }

  @On(events.users.userCreated)
  public onUserCreated(data: UserCreatedEvent): void {
    this._emailService
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
