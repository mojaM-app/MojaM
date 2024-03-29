/* eslint-disable no-new-wrappers */
import { isNumber, isPositiveNumber, toNumber } from './numbers.utils';

describe('numbers.utils', () => {
  describe('toNumber', () => {
    it('Check if result-number is correct if we provide a number argument', () => {
      expect(toNumber(0)).toBe(0);
      expect(toNumber(+0)).toBe(0);
      expect(toNumber(-0)).toBe(0);
      expect(toNumber(1)).toBe(1);
      expect(toNumber(+1)).toBe(1);
      expect(toNumber(-1)).toBe(-1);
      expect(toNumber(1.5)).toBe(1.5);
      expect(toNumber(+1.5)).toBe(1.5);
      expect(toNumber(-1.5)).toBe(-1.5);
      expect(toNumber(+'10')).toBe(10);
      expect(toNumber(+'1000')).toBe(1000);
      expect(toNumber(1 * 2)).toBe(2);
      expect(toNumber(1 / 2)).toBe(0.5);
      expect(toNumber(1 / 3)).toBe(1 / 3);
      expect(toNumber(1 + 1)).toBe(2);
      expect(toNumber(1 - 1)).toBe(0);
    });
    it('Check if result-number is correct if we provide a string argument', () => {
      expect(toNumber('0')).toBe(0);
      expect(toNumber('0,')).toBe(0);
      expect(toNumber('0.')).toBe(0);
      expect(toNumber('-0')).toBe(0);
      expect(toNumber('-0,')).toBe(0);
      expect(toNumber('-0.')).toBe(0);
      expect(toNumber('+0')).toBe(0);
      expect(toNumber('+0,')).toBe(0);
      expect(toNumber('+0.')).toBe(0);
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
      expect(toNumber(1.5 + '')).toBe(1.5);
    });
    it('Check if result is NULL if we provide an invalid argument', () => {
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
      expect(toNumber(+'-1 23 45 6.7 89')).toBe(null);
      expect(toNumber(Infinity)).toBe(null);
      expect(toNumber(NaN)).toBe(null);
      expect(toNumber(1 / 0)).toBe(null);
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
        }),
      ).toBe(null);
      expect(toNumber(function () {})).toBe(null);
      expect(
        toNumber(function () {
          return 1;
        }),
      ).toBe(null);
    });
  });
  describe('isNumber', () => {
    it('Check if result is TRUE', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-0)).toBe(true);
      expect(isNumber(1)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(1.5)).toBe(true);
      expect(isNumber(-1.5)).toBe(true);
      expect(isNumber(+'10')).toBe(true);
      expect(isNumber(1 * 2)).toBe(true);
      expect(isNumber(1 / 2)).toBe(true);
      expect(isNumber(1 - 2)).toBe(true);
      expect(isNumber(1 + 2)).toBe(true);
      expect(isNumber('0')).toBe(true);
      expect(isNumber('0,')).toBe(true);
      expect(isNumber('0.')).toBe(true);
      expect(isNumber('-0')).toBe(true);
      expect(isNumber('-0,')).toBe(true);
      expect(isNumber('-0.')).toBe(true);
      expect(isNumber('+0')).toBe(true);
      expect(isNumber('+0,')).toBe(true);
      expect(isNumber('+0.')).toBe(true);
      expect(isNumber('1')).toBe(true);
      expect(isNumber(' 1')).toBe(true);
      expect(isNumber('1 ')).toBe(true);
      expect(isNumber(' 1 ')).toBe(true);
      expect(isNumber('0 1')).toBe(true);
      expect(isNumber('5.5')).toBe(true);
      expect(isNumber('5,5')).toBe(true);
      expect(isNumber('-1')).toBe(true);
      expect(isNumber(' -1')).toBe(true);
      expect(isNumber('-1 ')).toBe(true);
      expect(isNumber(' -1 ')).toBe(true);
      expect(isNumber('-0 1')).toBe(true);
      expect(isNumber('-5.5')).toBe(true);
      expect(isNumber('-5,5')).toBe(true);
      expect(isNumber('1000')).toBe(true);
      expect(isNumber('-1000')).toBe(true);
      expect(isNumber('1 000')).toBe(true);
      expect(isNumber('-1 000')).toBe(true);
      expect(isNumber('1.')).toBe(true);
      expect(isNumber('1,')).toBe(true);
      expect(isNumber('-1.')).toBe(true);
      expect(isNumber('-1,')).toBe(true);
      expect(isNumber('.1')).toBe(true);
      expect(isNumber(',1')).toBe(true);
      expect(isNumber('-.1')).toBe(true);
      expect(isNumber('-,1')).toBe(true);
      expect(isNumber('1 0')).toBe(true);
      expect(isNumber('-1 0')).toBe(true);
      expect(isNumber('1 0.')).toBe(true);
      expect(isNumber('-1 0.')).toBe(true);
      expect(isNumber('1 0,')).toBe(true);
      expect(isNumber('-1 0,')).toBe(true);
      expect(isNumber('1 000 0')).toBe(true);
      expect(isNumber('-1 000 0')).toBe(true);
      expect(isNumber('1 000 0.')).toBe(true);
      expect(isNumber('-1 000 0.')).toBe(true);
      expect(isNumber('1 000 0,')).toBe(true);
      expect(isNumber('-1 000 0,')).toBe(true);
      expect(isNumber('1 23 45 6,7 89')).toBe(true);
      expect(isNumber('-1 23 45 6,7 89')).toBe(true);
      expect(isNumber('1 23 45 6.7 89')).toBe(true);
      expect(isNumber('-1 23 45 6.7 89')).toBe(true);
      expect(isNumber(+'1000')).toBe(true);
    });
    it('Check if result is FALSE', () => {
      expect(isNumber(Infinity)).toBe(false);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('')).toBe(false);
      expect(isNumber('.')).toBe(false);
      expect(isNumber(',')).toBe(false);
      expect(isNumber('-')).toBe(false);
      expect(isNumber('5x')).toBe(false);
      expect(isNumber('5-6')).toBe(false);
      expect(isNumber('=5')).toBe(false);
      expect(isNumber('x5')).toBe(false);
      expect(isNumber('abc')).toBe(false);
      expect(isNumber('null')).toBe(false);
      expect(isNumber('undefined')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber(new Date())).toBe(false);
      expect(isNumber(new String())).toBe(false);
      expect(isNumber(new Number())).toBe(false);
      expect(isNumber(new Number(1))).toBe(false);
      expect(isNumber(new Number(-1))).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber([])).toBe(false);
      expect(isNumber(() => {})).toBe(false);
    });
  });
  describe('isPositiveNumber', () => {
    it('Check if result is TRUE if we provide a valid positive string/number', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(1 + '')).toBe(true);
      expect(isPositiveNumber(+1)).toBe(true);
      expect(isPositiveNumber(1.5)).toBe(true);
      expect(isPositiveNumber(1.5 + '')).toBe(true);
      expect(isPositiveNumber(+1.5)).toBe(true);
      expect(isPositiveNumber(+'10')).toBe(true);
      expect(isPositiveNumber(1 * 2)).toBe(true);
      expect(isPositiveNumber(1 / 2)).toBe(true);
      expect(isPositiveNumber(1 + 2)).toBe(true);
      expect(isPositiveNumber('1')).toBe(true);
      expect(isPositiveNumber(' 1')).toBe(true);
      expect(isPositiveNumber('1 ')).toBe(true);
      expect(isPositiveNumber(' 1 ')).toBe(true);
      expect(isPositiveNumber('0 1')).toBe(true);
      expect(isPositiveNumber('5.5')).toBe(true);
      expect(isPositiveNumber('5,5')).toBe(true);
      expect(isPositiveNumber('1000')).toBe(true);
      expect(isPositiveNumber('1 000')).toBe(true);
      expect(isPositiveNumber('1.')).toBe(true);
    });
    it('Check if result is FALSE if we provide a valid negative string/number or if we provide an invalid argument', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-0)).toBe(false);
      expect(isPositiveNumber(+0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-1.5)).toBe(false);
      expect(isPositiveNumber(1 - 2)).toBe(false);
      expect(isPositiveNumber('0')).toBe(false);
      expect(isPositiveNumber('0,')).toBe(false);
      expect(isPositiveNumber('0.')).toBe(false);
      expect(isPositiveNumber('-0')).toBe(false);
      expect(isPositiveNumber('-0,')).toBe(false);
      expect(isPositiveNumber('-0.')).toBe(false);
      expect(isPositiveNumber('+0')).toBe(false);
      expect(isPositiveNumber('+0,')).toBe(false);
      expect(isPositiveNumber('+0.')).toBe(false);
      expect(isPositiveNumber('-1')).toBe(false);
      expect(isPositiveNumber(' -1')).toBe(false);
      expect(isPositiveNumber('-1 ')).toBe(false);
      expect(isPositiveNumber(' -1 ')).toBe(false);
      expect(isPositiveNumber('-0 1')).toBe(false);
      expect(isPositiveNumber('-5.5')).toBe(false);
      expect(isPositiveNumber('-5,5')).toBe(false);
      expect(isPositiveNumber('-1000')).toBe(false);
      expect(isPositiveNumber('-1 000')).toBe(false);
      expect(isPositiveNumber('-1.')).toBe(false);
      expect(isPositiveNumber(Infinity)).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
      expect(isPositiveNumber('')).toBe(false);
      expect(isPositiveNumber('.')).toBe(false);
      expect(isPositiveNumber(',')).toBe(false);
      expect(isPositiveNumber('-')).toBe(false);
      expect(isPositiveNumber('5x')).toBe(false);
      expect(isPositiveNumber('5-6')).toBe(false);
      expect(isPositiveNumber('=5')).toBe(false);
      expect(isPositiveNumber('x5')).toBe(false);
      expect(isPositiveNumber('abc')).toBe(false);
      expect(isPositiveNumber('null')).toBe(false);
      expect(isPositiveNumber('undefined')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
      expect(isPositiveNumber(undefined)).toBe(false);
      expect(isPositiveNumber(new Date())).toBe(false);
      expect(isPositiveNumber(new String())).toBe(false);
      expect(isPositiveNumber(new Number())).toBe(false);
      expect(isPositiveNumber(new Number(1))).toBe(false);
      expect(isPositiveNumber(new Number(-1))).toBe(false);
      expect(isPositiveNumber({})).toBe(false);
      expect(isPositiveNumber([])).toBe(false);
      expect(isPositiveNumber(() => {})).toBe(false);
    });
  });
});
