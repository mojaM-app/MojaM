export { DtoTransformFunctions } from './DtoTransformFunctions';
import { TLoginResult } from '@core';
import { loginAs, getTestApp, closeTestApp, TestApp } from './tests.utils';

export let testHelpers: {
  loginAs: (app: TestApp, user: { email?: string; phone?: string; passcode?: string | null }) => Promise<TLoginResult | null>;
  getTestApp: () => Promise<TestApp>;
  closeTestApp: () => Promise<void>;
};
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  testHelpers = {
    loginAs,
    getTestApp,
    closeTestApp,
  };
}
