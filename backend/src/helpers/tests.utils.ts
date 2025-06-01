import { ILoginModel, registerModules, TLoginResult } from '@core';
import { EventDispatcherService } from '@events';
import { AnnouncementsListRoute, AnnouncementsRout } from '@modules/announcements';
import { AuthRoute } from '@modules/auth';
import { CalendarRoutes } from '@modules/calendar';
import { CommunityRoute } from '@modules/community';
import { NewsRoutes } from '@modules/news';
import { PermissionsRoute } from '@modules/permissions';
import { UserDetailsRoute, UserListRoute, UserProfileRoute, UserRoute } from '@modules/users';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { App } from './../app';
import { registerTestEventHandlers } from './event-handler-tests.helper';

export class TestApp extends App {
  private mockSendMail: jest.SpyInstance | null = null;

  constructor() {
    super();
    registerModules();
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
}

export const loginAs = async (app: App, user: { email?: string; phone?: string; passcode?: string | null }): Promise<TLoginResult | null> => {
  const loginDto = { email: user.email, phone: user.phone, passcode: user.passcode } satisfies ILoginModel;
  try {
    const loginResponse = await request(app.getServer()).post(AuthRoute.loginPath).send(loginDto);
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

    await app.initialize([
      new AnnouncementsRout(),
      new AnnouncementsListRoute(),
      new AuthRoute(),
      new CalendarRoutes(),
      new CommunityRoute(),
      new NewsRoutes(),
      new PermissionsRoute(),
      new UserRoute(),
      new UserListRoute(),
      new UserDetailsRoute(),
      new UserProfileRoute(),
    ]);
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
