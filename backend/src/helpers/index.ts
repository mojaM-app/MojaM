import { NODE_ENV } from '@config';
import { closeTestApp, getTestApp, TestApp } from './test-helpers/test.app';

export let testHelpers: {
  getTestApp: () => Promise<TestApp>;
  closeTestApp: () => Promise<void>;
};
if (NODE_ENV === 'test' || NODE_ENV === 'development') {
  testHelpers = {
    getTestApp,
    closeTestApp,
  };
}
