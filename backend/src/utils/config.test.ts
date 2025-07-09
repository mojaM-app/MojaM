import { exportsForTesting } from '../config';

describe('getEnvName', () => {
  test('getEnvName', () => {
    expect(exportsForTesting.getEnvName('production')).toBe('production');
    expect(exportsForTesting.getEnvName('development')).toBe('development');
    expect(exportsForTesting.getEnvName('test')).toBe('development');
    expect(exportsForTesting.getEnvName('any')).toBe('development');
  });
});
