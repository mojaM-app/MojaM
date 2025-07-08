import { DatabaseLoggerService, events, IWelcomeEmailSettings, LinkHelper } from '@core';
import { UserCreatedEvent } from '@modules/users';
import { EventSubscriber, On } from 'event-dispatch';
import { Container } from 'typedi';
import { EmailService } from '../services/email.service';

@EventSubscriber()
export class UserCreatedEventSubscriber {
  private readonly _databaseLoggerService: DatabaseLoggerService;

  constructor() {
    this._databaseLoggerService = Container.get(DatabaseLoggerService);
  }

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
          this._databaseLoggerService.debug(`Welcome email sent to '${data.user.email}'`);
        }
        return success;
      })
      .catch((error: Error) => {
        this._databaseLoggerService.error(`Failed to send welcome email to '${data.user.email}'`, error);
      });
  }
}
