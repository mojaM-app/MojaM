import { App } from '@/app';
import { AuthRoute } from '@modules/auth/auth.routes';
import { LoginDto } from '@modules/auth/dtos/login.dto';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword, generateRandomString } from '@utils/tests.utils';
import request from 'supertest';
import { IUser } from '../interfaces/IUser';

const generateValidUser = (): CreateUserDto => {
  return <CreateUserDto>{
    email: generateRandomEmail(),
    password: generateRandomPassword(),
    phone: '88' + generateRandomNumber(7),
    firstName: generateRandomString(10),
  };
};

const getJwtToken = (response: any): string => {
  const headers = response.headers;
  const cookies = headers['set-cookie'];
  const cookie = cookies[0];
  return cookie.split(';')[0].split('=')[1];
};

const loginAs = async (app: App, user: { login: string; password: string }): Promise<{ userLoggedIn: IUser; authToken: string }> => {
  const authRoute = new AuthRoute();
  const loginDto: LoginDto = { login: user.login, password: user.password };
  const loginResponse = await request(app.getServer()).post(authRoute.loginPath).send(loginDto);
  const authToken = loginResponse.statusCode === 200 ? getJwtToken(loginResponse) : '';
  return { userLoggedIn: loginResponse.body.data, authToken: authToken };
};

export { generateValidUser, loginAs };
