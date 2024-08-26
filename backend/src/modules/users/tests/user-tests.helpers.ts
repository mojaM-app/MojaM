import { App } from '@/app';
import { AuthRoute, LoginDto, TLoginResult } from '@modules/auth';
import { CreateUserDto } from '@modules/users';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword } from '@utils/tests.utils';
import request from 'supertest';

const generateValidUser = (): CreateUserDto => {
  return {
    email: generateRandomEmail(),
    password: generateRandomPassword(),
    phone: '88' + generateRandomNumber(7),
  } satisfies CreateUserDto;
};

const loginAs = async (app: App, user: { email?: string; phone?: string; password?: string }): Promise<TLoginResult | null> => {
  const loginDto = { email: user.email, phone: user.phone, password: user.password } satisfies LoginDto;
  try {
    const loginResponse = await request(app.getServer()).post(new AuthRoute().loginPath).send(loginDto);
    const loginResult: TLoginResult = loginResponse.statusCode === 200 ? loginResponse.body.data : {};
    return loginResult;
  } catch (error) {
    console.error('Error in loginAs:', error);
    return null;
  }
};

export { generateValidUser, loginAs };
