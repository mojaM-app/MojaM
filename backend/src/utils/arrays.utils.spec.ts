import { arraysEquals, isArray, isArrayEmpty } from './arrays.utils';

describe('arrays.utils', () => {
  describe('arrayEquals', () => {
    it('Check if arrays are equal', () => {
      expect(arraysEquals(null, null)).toBe(true);
      expect(arraysEquals(null, undefined)).toBe(true);
      expect(arraysEquals(undefined, null)).toBe(true);
      expect(arraysEquals(undefined, undefined)).toBe(true);
      expect(arraysEquals(null, [])).toBe(true);
      expect(arraysEquals([], null)).toBe(true);
      expect(arraysEquals(undefined, [])).toBe(true);
      expect(arraysEquals([], undefined)).toBe(true);
      expect(arraysEquals([], [])).toBe(true);
      expect(arraysEquals([1], [1])).toBe(true);
      expect(arraysEquals([1, 2], [2, 1])).toBe(true);
      expect(arraysEquals(['a'], ['a'])).toBe(true);
      expect(arraysEquals(['a', 'b'], ['b', 'a'])).toBe(true);
      expect(arraysEquals([''], [''])).toBe(true);
      expect(arraysEquals([0], [0])).toBe(true);
      expect(arraysEquals([[]], [[]])).toBe(true);
      expect(arraysEquals([null], [null])).toBe(true);
      expect(arraysEquals([undefined], [undefined])).toBe(true);
      expect(arraysEquals([new String('test')], [new String('test')])).toBe(true);
      expect(arraysEquals([{}], [{}])).toBe(true);
      expect(arraysEquals([{ a: 1 }], [{ a: 1 }])).toBe(true);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: {} }])).toBe(true);
      expect(arraysEquals([function () {}], [function () {}])).toBe(true);
      expect(
        arraysEquals(
          [
            function () {
              return 1;
            },
          ],
          [
            function () {
              return 1;
            },
          ],
        ),
      ).toBe(true);
      expect(
        arraysEquals(
          [
            () => {
              return 1;
            },
          ],
          [
            () => {
              return 1;
            },
          ],
        ),
      ).toBe(true);
      class Dog {
        public readonly name: string;
        public constructor(name: string) {
          this.name = name;
        }
      }
      (Dog as any).prototype.numLegs = 4;
      const beagle = new Dog('Dog');
      expect(arraysEquals([beagle], [beagle])).toBe(true);
    });
    it('Check if arrays are NOT equal', () => {
      expect(arraysEquals(null, [1])).toBe(false);
      expect(arraysEquals(null, [0])).toBe(false);
      expect(arraysEquals(null, ['a'])).toBe(false);
      expect(arraysEquals(null, [false])).toBe(false);
      expect(arraysEquals(null, [{}])).toBe(false);
      expect(arraysEquals(undefined, [{}])).toBe(false);
      expect(arraysEquals(undefined, [1])).toBe(false);
      expect(arraysEquals(undefined, [0])).toBe(false);
      expect(arraysEquals(undefined, ['a'])).toBe(false);
      expect(arraysEquals(undefined, [false])).toBe(false);
      expect(arraysEquals([1], null)).toBe(false);
      expect(arraysEquals([0], null)).toBe(false);
      expect(arraysEquals(['a'], null)).toBe(false);
      expect(arraysEquals([false], null)).toBe(false);
      expect(arraysEquals([1], undefined)).toBe(false);
      expect(arraysEquals([0], undefined)).toBe(false);
      expect(arraysEquals(['a'], undefined)).toBe(false);
      expect(arraysEquals([false], undefined)).toBe(false);
      expect(arraysEquals([{}], undefined)).toBe(false);
      expect(arraysEquals([], [1])).toBe(false);
      expect(arraysEquals([], [[]])).toBe(false);
      expect(arraysEquals([], [0])).toBe(false);
      expect(arraysEquals([], ['a'])).toBe(false);
      expect(arraysEquals([1], null)).toBe(false);
      expect(arraysEquals([1], [])).toBe(false);
      expect(arraysEquals([false], null)).toBe(false);
      expect(arraysEquals([false], [])).toBe(false);
      expect(arraysEquals([false], [0])).toBe(false);
      expect(arraysEquals([false], [''])).toBe(false);
      expect(arraysEquals([1], [0])).toBe(false);
      expect(arraysEquals(['0'], [0])).toBe(false);
      expect(arraysEquals(['a'], ['b', 'a'])).toBe(false);
      expect(arraysEquals(['b', 'a'], ['a'])).toBe(false);
      expect(arraysEquals([{}], null)).toBe(false);
      expect(arraysEquals([], [{}])).toBe(false);
      expect(arraysEquals([null], [{}])).toBe(false);
      expect(arraysEquals([undefined], [{}])).toBe(false);
      expect(arraysEquals([[]], [{}])).toBe(false);
      expect(arraysEquals([{ a: 1 }], [{}])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1 }])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: 2 }])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: undefined }])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: null }])).toBe(false);
      expect(arraysEquals([{ a: 1, b: {} }], [{ a: 1, b: { c: 2 } }])).toBe(false);
      expect(arraysEquals([function (a: any) {}], [function (b: any) {}])).toBe(false);
      expect(
        arraysEquals(
          [
            function () {
              return 1;
            },
          ],
          [function () {}],
        ),
      ).toBe(false);
      expect(
        arraysEquals(
          [
            function () {
              return 1;
            },
          ],
          [
            function () {
              return 2;
            },
          ],
        ),
      ).toBe(false);
      expect(
        arraysEquals(
          [
            function () {
              return 1;
            },
          ],
          [
            () => {
              return 1;
            },
          ],
        ),
      ).toBe(false);
      expect(
        arraysEquals(
          [
            function () {
              const x = 1;
              return x;
            },
          ],
          [
            function () {
              return 1;
            },
          ],
        ),
      ).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for valid arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b', 'c'])).toBe(true);
      expect(isArray([null, undefined])).toBe(true);
      expect(isArray([{}, {}])).toBe(true);
    });

    it('should return false for invalid arrays', () => {
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray('abc')).toBe(false);
      expect(isArray({})).toBe(false);
      expect(isArray(() => {})).toBe(false);
    });
  });

  describe('isArrayEmpty', () => {
    it('should return true for empty arrays', () => {
      expect(isArrayEmpty([])).toBe(true);
    });

    it('should return false for non-empty arrays', () => {
      expect(isArrayEmpty([1])).toBe(false);
      expect(isArrayEmpty(['a'])).toBe(false);
      expect(isArrayEmpty([null])).toBe(false);
    });

    it('should return false for non-array values', () => {
      expect(isArrayEmpty(null)).toBe(false);
      expect(isArrayEmpty(undefined)).toBe(false);
      expect(isArrayEmpty({})).toBe(false);
      expect(isArrayEmpty('')).toBe(false);
      expect(isArrayEmpty(0)).toBe(false);
    });
  });

  describe('objectsEqual (internal)', () => {
    // We test the internal objectsEqual function through specific cases
    it('should handle properties not owned by the object', () => {
      // Create objects with prototype properties
      const proto = { inheritedProp: 'test' };
      const obj1 = Object.create(proto);
      const obj2 = Object.create(proto);

      // This will exercise the line: if (!x.hasOwnProperty(p)) { continue; }
      expect(arraysEquals([obj1], [obj2])).toBe(true);

      // Add an own property to one object
      obj1.ownProp = 'value';
      expect(arraysEquals([obj1], [obj2])).toBe(false);
    });

    it('should handle objects with different constructors', () => {
      class A {}
      class B {}

      const a = new A();
      const b = new B();

      expect(arraysEquals([a], [b])).toBe(false);
    });

    it('should handle Date objects correctly', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      const date3 = new Date('2023-02-01');

      expect(arraysEquals([date1], [date2])).toBe(true);
      expect(arraysEquals([date1], [date3])).toBe(false);
    });

    it('should handle RegExp objects correctly', () => {
      const regex1 = /test/;
      const regex2 = /test/;
      const regex3 = /different/;

      expect(arraysEquals([regex1], [regex2])).toBe(true);
      expect(arraysEquals([regex1], [regex3])).toBe(false);
    });

    it('should handle Number objects correctly', () => {
      const num1 = new Number(42);
      const num2 = new Number(42);
      const num3 = new Number(43);

      expect(arraysEquals([num1], [num2])).toBe(true);
      expect(arraysEquals([num1], [num3])).toBe(false);
    });

    it('should handle String objects correctly', () => {
      const str1 = new String('test');
      const str2 = new String('test');
      const str3 = new String('different');

      expect(arraysEquals([str1], [str2])).toBe(true);
      expect(arraysEquals([str1], [str3])).toBe(false);
    });

    it('should handle nested objects with additional properties in y', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1, b: 2 };

      expect(arraysEquals([obj1], [obj2])).toBe(false);
    });

    it('should handle primitives that are not objects', () => {
      expect(arraysEquals([1], ['1'])).toBe(false);
    });
  });
});
