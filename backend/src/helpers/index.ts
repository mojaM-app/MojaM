export { DtoTransformFunctions } from './DtoTransformFunctions';
import { IUser } from '@core';
import { IRoutes } from '@interfaces';
import { TLoginResult } from '@modules/auth';
import { CreateUserDto } from '@modules/users';
import { generateValidUserWithPassword, generateValidUserWithPin, loginAs, getTestApp, closeTestApp, TestApp } from './tests.utils';

export let testUtils: {
  generateValidUserWithPassword: () => CreateUserDto & IUser;
  generateValidUserWithPin: () => CreateUserDto & IUser;
  loginAs: (app: TestApp, user: { email?: string; phone?: string; passcode?: string | null }) => Promise<TLoginResult | null>;
  getTestApp: (routes: IRoutes[]) => Promise<TestApp>;
  closeTestApp: () => Promise<void>;
};
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  testUtils = {
    generateValidUserWithPassword,
    generateValidUserWithPin,
    loginAs,
    getTestApp,
    closeTestApp,
  };
}
