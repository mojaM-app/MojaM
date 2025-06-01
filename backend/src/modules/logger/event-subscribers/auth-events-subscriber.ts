import { events } from '@events';
import {
  FailedLoginAttemptEvent,
  InactiveUserTriesToLogInEvent,
  LockedUserTriesToLogInEvent,
  UserLockedOutEvent,
  UserLoggedInEvent,
  UserPasscodeChangedEvent,
  UserRefreshedTokenEvent,
} from '@modules/auth';
import { EventSubscriber, On } from 'event-dispatch';
import { Service } from 'typedi';
import { logger } from '../logger';

@Service()
@EventSubscriber()
export class AuthEventsSubscriber {
  @On(events.users.userLoggedIn)
  public onLogIn(data: UserLoggedInEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) logged in!`);
  }

  @On(events.users.inactiveUserTriesToLogIn)
  public inactiveUserTriesToLogIn(data: InactiveUserTriesToLogInEvent): void {
    logger.debug(`Inactive user ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) tries to logIn!`);
  }

  @On(events.users.lockedUserTriesToLogIn)
  public lockedUserTriesToLogIn(data: LockedUserTriesToLogInEvent): void {
    logger.debug(`Locked user ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) tries to logIn!`);
  }

  @On(events.users.failedLoginAttempt)
  public onFailedLoginAttempt(data: FailedLoginAttemptEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) tries to logIn!`);
  }

  @On(events.users.userLockedOut)
  public onUserLockedOut(data: UserLockedOutEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) is locked out!`);
  }

  @On(events.users.userRefreshedToken)
  public onUserRefreshedToken(data: UserRefreshedTokenEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) refreshed token!`);
  }

  @On(events.users.userPasscodeChanged)
  public onUserPasscodeChanged(data: UserPasscodeChangedEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) changed passcode!`);
  }
}
