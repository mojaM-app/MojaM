import { EventDispatcherService, ILoginModel, RouteConstants, TLoginResult } from '@core';
import { ModulesRegistry } from '@modules/modules-registry';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { App } from './../app';
import { registerTestEventHandlers } from './event-handler-tests.helper';

// Import all the actual event subscribers
import './../modules/users/event-subscribers/logger-events-subscriber';
import './../modules/auth/event-subscribers/logger-events-subscriber';
import './../modules/announcements/event-subscribers/logger-events-subscriber';
import './../modules/calendar/event-subscribers/logger-events-subscriber';
import './../modules/permissions/event-subscribers/logger-events-subscriber';
import './../modules/notifications/event-subscribers/user-created-events-subscriber';
import './../modules/notifications/event-subscribers/user-locked-out-events-subscriber';

export class TestApp extends App {
  private mockSendMail: jest.SpyInstance | null = null;

  constructor() {
    super();
    ModulesRegistry.registerAll();
    this.registerActualEventSubscribers();
    this.registerTestEventHandlers();
  }

  // Mock nodemailer
  public mock_nodemailer_createTransport(): TestApp {
    this.mockSendMail = jest.fn().mockImplementation((mailOptions: any, callback: (error: any, info: any) => void) => {
      callback(null, null);
    });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      _is_mock: true,
      sendMail: this.mockSendMail,
      close: jest.fn().mockImplementation(() => {}),
    } as any);

    return this;
  }

  //reset all mocks
  public resetMocks(): void {
    if (this.mockSendMail) {
      this.mockSendMail.mockRestore();
      this.mockSendMail.mockClear();
      this.mockSendMail = null;
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

export const loginAs = async (app: App, user: { email?: string; phone?: string; passcode?: string | null }): Promise<TLoginResult | null> => {
  const loginDto = { email: user.email, phone: user.phone, passcode: user.passcode } satisfies ILoginModel;
  try {
    const loginResponse = await request(app.getServer()).post(RouteConstants.AUTH_LOGIN_PATH).send(loginDto);
    const loginResult: TLoginResult = loginResponse.statusCode === 200 ? loginResponse.body.data : {};
    return loginResult;
  } catch (error) {
    console.error('Error in loginAs:', error);
    return null;
  }
};

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
