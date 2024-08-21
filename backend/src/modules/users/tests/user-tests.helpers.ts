import { App } from '@/app';
import { AuthRoute, LoginDto } from '@modules/auth';
import { TLoginResult } from '@modules/auth/models/LoginResult';
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

const loginAs = async (app: App, user: { login: string | null | undefined; password: string | null | undefined }): Promise<TLoginResult | null> => {
  const loginDto = { login: user.login, password: user.password } satisfies LoginDto;
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
