import { VALIDATOR_SETTINGS } from '@config';
import { IUser } from '@core';
import { EventDispatcherService } from '@events';
import { IRoutes } from '@interfaces';
import { AuthRoute, LoginDto, TLoginResult } from '@modules/auth';
import { CreateUserDto } from '@modules/users';
import { EventDispatcher } from 'event-dispatch';
import nodemailer from 'nodemailer';
import request from 'supertest';
import { registerTestEventHandlers } from './event-handler-tests.helper';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword } from '../utils/random.utils';
import { App } from './../app';

export class TestApp extends App {
  private mockSendMail: jest.SpyInstance | null = null;

  constructor() {
    super();
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

const generateValidUser = (): any => {
  return {
    email: generateRandomEmail(),
    phone: '88' + generateRandomNumber(7),
    getFirstLastName: () => 'John Doe',
    getFirstLastNameOrEmail: () => 'John Doe',
    getLastFirstName: () => 'Doe John',
    getLastFirstNameOrEmail: () => 'Doe John',
    isAdmin: () => true,
  };
};

export const generateValidUserWithPassword = (): CreateUserDto & IUser => {
  return {
    ...generateValidUser(),
    passcode: generateRandomPassword(),
  } satisfies CreateUserDto & IUser;
};

export const generateValidUserWithPin = (): CreateUserDto & IUser => {
  return {
    ...generateValidUser(),
    passcode: generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH),
  } satisfies CreateUserDto & IUser;
};

export const loginAs = async (app: App, user: { email?: string; phone?: string; passcode?: string | null }): Promise<TLoginResult | null> => {
  const loginDto = { email: user.email, phone: user.phone, passcode: user.passcode } satisfies LoginDto;
  try {
    const loginResponse = await request(app.getServer()).post(new AuthRoute().loginPath).send(loginDto);
    const loginResult: TLoginResult = loginResponse.statusCode === 200 ? loginResponse.body.data : {};
    return loginResult;
  } catch (error) {
    console.error('Error in loginAs:', error);
    return null;
  }
};

let app: TestApp | null = null;

export async function getTestApp(routes: IRoutes[]): Promise<TestApp> {
  if (!app) {
    app = new TestApp();
    await app.initialize(routes);
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
