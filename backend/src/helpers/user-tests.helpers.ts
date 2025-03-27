import { App } from '@/app';
import { VALIDATOR_SETTINGS } from '@config';
import { AuthRoute, LoginDto, TLoginResult } from '@modules/auth';
import { CreateUserDto, IUser } from '@modules/users';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword } from '@utils/tests.utils';
import request from 'supertest';

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

const generateValidUserWithPassword = (): CreateUserDto & IUser => {
  return {
    ...generateValidUser(),
    passcode: generateRandomPassword(),
  } satisfies CreateUserDto & IUser;
};

const generateValidUserWithPin = (): CreateUserDto & IUser => {
  return {
    ...generateValidUser(),
    passcode: generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH),
  } satisfies CreateUserDto & IUser;
};

const loginAs = async (app: App, user: { email?: string; phone?: string; passcode?: string | null }): Promise<TLoginResult | null> => {
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

export { generateValidUserWithPassword, generateValidUserWithPin, loginAs };
