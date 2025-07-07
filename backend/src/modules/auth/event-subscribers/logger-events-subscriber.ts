import { DatabaseLoggerService, events } from '@core';
import { EventSubscriber, On } from 'event-dispatch';
import { Container } from 'typedi';
import { FailedLoginAttemptEvent } from '../events/failed-login-attempt-event';
import { InactiveUserTriesToLogInEvent } from '../events/inactive-user-tries-to-log-in-event';
import { LockedUserTriesToLogInEvent } from '../events/locked-user-tries-to-log-in-event';
import { UserLockedOutEvent } from '../events/user-locked-out-event';
import { UserLoggedInEvent } from '../events/user-logged-in-event';
import { UserPasscodeChangedEvent } from '../events/user-passcode-changed-event';
import { UserRefreshedTokenEvent } from '../events/user-refreshed-token-event';

@EventSubscriber()
export class AuthEventsSubscriber {
  private readonly _databaseLoggerService: DatabaseLoggerService;

  constructor() {
    this._databaseLoggerService = Container.get(DatabaseLoggerService);
  }

  @On(events.users.userLoggedIn)
  public onLogIn(data: UserLoggedInEvent): void {
    this._databaseLoggerService.debug(
      `User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) logged in!`,
    );
  }

  @On(events.users.inactiveUserTriesToLogIn)
  public inactiveUserTriesToLogIn(data: InactiveUserTriesToLogInEvent): void {
    this._databaseLoggerService.debug(
      `Inactive user ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) tries to logIn!`,
    );
  }

  @On(events.users.lockedUserTriesToLogIn)
  public lockedUserTriesToLogIn(data: LockedUserTriesToLogInEvent): void {
    this._databaseLoggerService.debug(
      `Locked user ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) tries to logIn!`,
    );
  }

  @On(events.users.failedLoginAttempt)
  public onFailedLoginAttempt(data: FailedLoginAttemptEvent): void {
    this._databaseLoggerService.debug(
      `User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) tries to logIn!`,
    );
  }

  @On(events.users.userLockedOut)
  public onUserLockedOut(data: UserLockedOutEvent): void {
    this._databaseLoggerService.debug(
      `User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) is locked out!`,
    );
  }

  @On(events.users.userRefreshedToken)
  public onUserRefreshedToken(data: UserRefreshedTokenEvent): void {
    this._databaseLoggerService.debug(
      `User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) refreshed token!`,
    );
  }

  @On(events.users.userPasscodeChanged)
  public onUserPasscodeChanged(data: UserPasscodeChangedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) changed passcode!`,
    );
  }
}
