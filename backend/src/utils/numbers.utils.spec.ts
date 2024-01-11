/* eslint-disable no-new-wrappers */
import { toNumber } from './numbers.utils';

/* eslint-disable @typescript-eslint/no-empty-function */
describe('numbers.utils', () => {
  describe('parse', () => {
    it('Check if number is correct if we provide a number argument', () => {
      expect(toNumber(0)).toBe(0);
      expect(toNumber(-0)).toBe(0);
      expect(toNumber(1)).toBe(1);
      expect(toNumber(-1)).toBe(-1);
      expect(toNumber(1.5)).toBe(1.5);
      expect(toNumber(-1.5)).toBe(-1.5);
      expect(toNumber(Infinity)).toBe(null);
      expect(toNumber(NaN)).toBe(null);
      expect(toNumber(+'10')).toBe(10);
      expect(toNumber(1 * 2)).toBe(2);
      expect(toNumber(1 / 2)).toBe(0.5);
      expect(toNumber(1 / 3)).toBe(1 / 3);
      expect(toNumber(1 / 0)).toBe(null);
    });
    it('Check if number is correct if we provide a string argument', () => {
      expect(toNumber('0')).toBe(0);
      expect(toNumber('0,')).toBe(0);
      expect(toNumber('0.')).toBe(0);
      expect(toNumber('-0')).toBe(0);
      expect(toNumber('-0,')).toBe(0);
      expect(toNumber('-0.')).toBe(0);
      expect(toNumber('1')).toBe(1);
      expect(toNumber(' 1')).toBe(1);
      expect(toNumber('1 ')).toBe(1);
      expect(toNumber(' 1 ')).toBe(1);
      expect(toNumber('0 1')).toBe(1);
      expect(toNumber('5.5')).toBe(5.5);
      expect(toNumber('5,5')).toBe(5.5);
      expect(toNumber('-1')).toBe(-1);
      expect(toNumber(' -1')).toBe(-1);
      expect(toNumber('-1 ')).toBe(-1);
      expect(toNumber(' -1 ')).toBe(-1);
      expect(toNumber('-0 1')).toBe(-1);
      expect(toNumber('-5.5')).toBe(-5.5);
      expect(toNumber('-5,5')).toBe(-5.5);
      expect(toNumber('1000')).toBe(1000);
      expect(toNumber('-1000')).toBe(-1000);
      expect(toNumber('1 000')).toBe(1000);
      expect(toNumber('-1 000')).toBe(-1000);
      expect(toNumber('1.')).toBe(1);
      expect(toNumber('1,')).toBe(1);
      expect(toNumber('-1.')).toBe(-1);
      expect(toNumber('-1,')).toBe(-1);
      expect(toNumber('.1')).toBe(0.1);
      expect(toNumber(',1')).toBe(0.1);
      expect(toNumber('-.1')).toBe(-0.1);
      expect(toNumber('-,1')).toBe(-0.1);
      expect(toNumber('1 0')).toBe(10);
      expect(toNumber('-1 0')).toBe(-10);
      expect(toNumber('1 0.')).toBe(10);
      expect(toNumber('-1 0.')).toBe(-10);
      expect(toNumber('1 0,')).toBe(10);
      expect(toNumber('-1 0,')).toBe(-10);
      expect(toNumber('1 000 0')).toBe(10000);
      expect(toNumber('-1 000 0')).toBe(-10000);
      expect(toNumber('1 000 0.')).toBe(10000);
      expect(toNumber('-1 000 0.')).toBe(-10000);
      expect(toNumber('1 000 0,')).toBe(10000);
      expect(toNumber('-1 000 0,')).toBe(-10000);
      expect(toNumber('1 23 45 6,7 89')).toBe(123456.789);
      expect(toNumber('-1 23 45 6,7 89')).toBe(-123456.789);
      expect(toNumber('1 23 45 6.7 89')).toBe(123456.789);
      expect(toNumber('-1 23 45 6.7 89')).toBe(-123456.789);
      expect(toNumber(+'1000')).toBe(1000);
    });
    it('Check if result is correct if we provide an invalid argument', () => {
      expect(toNumber('')).toBe(null);
      expect(toNumber('.')).toBe(null);
      expect(toNumber(',')).toBe(null);
      expect(toNumber('-')).toBe(null);
      expect(toNumber('5x')).toBe(null);
      expect(toNumber('5-6')).toBe(null);
      expect(toNumber('=5')).toBe(null);
      expect(toNumber('x5')).toBe(null);
      expect(toNumber('abc')).toBe(null);
      expect(toNumber('null')).toBe(null);
      expect(toNumber('undefined')).toBe(null);
      expect(toNumber(null)).toBe(null);
      expect(toNumber(undefined)).toBe(null);
      expect(toNumber(new Date())).toBe(null);
      expect(toNumber(new String())).toBe(null);
      expect(toNumber(new Number())).toBe(null);
      expect(toNumber(new Number(1))).toBe(null);
      expect(toNumber(new Number(-1))).toBe(null);
      expect(toNumber({})).toBe(null);
      expect(toNumber([])).toBe(null);
      expect(toNumber(() => {})).toBe(null);
      expect(
        toNumber(() => {
          return 1;
        })
      ).toBe(null);
      expect(toNumber(function () {})).toBe(null);
      expect(
        toNumber(function () {
          return 1;
        })
      ).toBe(null);
    });
  });
});
