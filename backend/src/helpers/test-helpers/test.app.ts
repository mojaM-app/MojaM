import { EventDispatcherService } from '@core';
import { ModulesRegistry } from '@modules/modules-registry';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import { type ITestApp } from './test-helpers.interface';
import { App } from '../../app';
import { registerTestEventHandlers } from '../event-handler-tests.helper';
import { AuthHelpers } from './auth.test-helpers';
import { NewsHelpers } from './news.test-helpers';
import { PermissionsHelpers } from './permission.test-helpers';
import { UserDetailsHelpers } from './user-details.test-helpers';
import { UserListHelpers } from './user-list.test-helpers';
import { UserProfileHelpers } from './user-profile.test-helpers';
import { UserHelpers } from './user.test-helpers';

// Import all the actual event subscribers
import '../../modules/users/event-subscribers/logger-events-subscriber';
import '../../modules/auth/event-subscribers/logger-events-subscriber';
import '../../modules/announcements/event-subscribers/logger-events-subscriber';
import '../../modules/calendar/event-subscribers/logger-events-subscriber';
import '../../modules/permissions/event-subscribers/logger-events-subscriber';
import '../../modules/notifications/event-subscribers/user-created-events-subscriber';
import '../../modules/notifications/event-subscribers/user-locked-out-events-subscriber';

export class TestApp extends App implements ITestApp {
  private _mockSendMail: jest.SpyInstance | null = null;
  private readonly _userHelpers: UserHelpers = new UserHelpers(this);
  private readonly _userProfileHelpers: UserProfileHelpers = new UserProfileHelpers(this);
  private readonly _userDetailsHelpers: UserDetailsHelpers = new UserDetailsHelpers(this);
  private readonly _userListHelpers: UserListHelpers = new UserListHelpers(this);
  private readonly _authHelpers: AuthHelpers = new AuthHelpers(this);
  private readonly _permissionsHelpers: PermissionsHelpers = new PermissionsHelpers(this);
  private readonly _newsHelpers: NewsHelpers = new NewsHelpers(this);

  public get user(): UserHelpers {
    return this._userHelpers;
  }

  public get userProfile(): UserProfileHelpers {
    return this._userProfileHelpers;
  }

  public get userList(): UserListHelpers {
    return this._userListHelpers;
  }

  public get userDetails(): UserDetailsHelpers {
    return this._userDetailsHelpers;
  }

  public get auth(): AuthHelpers {
    return this._authHelpers;
  }

  public get permissions(): PermissionsHelpers {
    return this._permissionsHelpers;
  }

  public get news(): NewsHelpers {
    return this._newsHelpers;
  }

  constructor() {
    super();
    ModulesRegistry.registerAll();
    this.registerActualEventSubscribers();
    this.registerTestEventHandlers();
  }

  // Mock nodemailer
  public mock_nodemailer_createTransport(): TestApp {
    this._mockSendMail = jest.fn().mockImplementation((mailOptions: any, callback: (error: any, info: any) => void) => {
      callback(null, null);
    });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      _is_mock: true,
      sendMail: this._mockSendMail,
      close: jest.fn().mockImplementation(() => {}),
    } as any);

    return this;
  }

  //reset all mocks
  public resetMocks(): void {
    if (this._mockSendMail) {
      this._mockSendMail.mockRestore();
      this._mockSendMail.mockClear();
      this._mockSendMail = null;
    }
  }

  // Set up event dispatcher
  private registerTestEventHandlers(): void {
    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  }

  // Register actual event subscribers to ensure they work in tests
  private registerActualEventSubscribers(): void {
    // The imports at the top of this file should trigger the @EventSubscriber() decorators
    // This method is a placeholder to ensure the event subscribers are properly registered
    // during tests. The imports ensure the event subscriber classes are loaded.
  }
}

let app: TestApp | null = null;

export async function getTestApp(): Promise<TestApp> {
  if (!app) {
    app = new TestApp();
    await app.initialize([...ModulesRegistry.getRoutes()]);
  }

  return app;
}

export async function closeTestApp(): Promise<void> {
  if (app) {
    await app.closeDbConnection();
    app.resetMocks();
    app = null;
  }
}
