import { App } from '@/app';
import { AuthRoute, LoginDto } from '@modules/auth';
import { CreateUserDto, IUser } from '@modules/users';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword } from '@utils/tests.utils';
import request from 'supertest';

const generateValidUser = (): CreateUserDto => {
  return {
    email: generateRandomEmail(),
    password: generateRandomPassword(),
    phone: '88' + generateRandomNumber(7)
  } satisfies CreateUserDto;
};

const getJwtToken = (response: any): string => {
  const headers = response.headers;
  const cookies = headers['set-cookie'];
  const cookie = cookies[0];
  return cookie.split(';')[0].split('=')[1];
};

const loginAs = async (app: App, user: { login: string, password: string }): Promise<{ userLoggedIn: IUser, authToken: string }> => {
  const loginDto: LoginDto = { login: user.login, password: user.password };
  const loginResponse = await request(app.getServer()).post(new AuthRoute().loginPath).send(loginDto);
  const authToken = loginResponse.statusCode === 200 ? getJwtToken(loginResponse) : '';
  const userLoggedIn = loginResponse.statusCode === 200 ? loginResponse.body.data : null;
  return { userLoggedIn, authToken };
};

export { generateValidUser, loginAs };
