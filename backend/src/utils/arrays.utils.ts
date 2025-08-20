/* eslint-disable security/detect-object-injection */
import { isNullOrUndefined } from './object.utils';

interface IObjectLike {
  [key: string]: unknown;
  constructor: unknown;
  hasOwnProperty: (property: string) => boolean;
}

const hasOwnProperty = (obj: Record<string, unknown>, prop: string): boolean => {
  return Object.hasOwn(obj, prop);
};

const isSpecialObjectType = (x: IObjectLike, y: IObjectLike): boolean => {
  const specialTypes = [
    x instanceof Date && y instanceof Date,
    x instanceof RegExp && y instanceof RegExp,
    x instanceof String && y instanceof String,
    x instanceof Number && y instanceof Number,
  ];

  return specialTypes.some(Boolean);
};

const compareDates = (x: Date, y: Date): boolean => {
  return x.valueOf() === y.valueOf();
};

const compareRegExps = (x: RegExp, y: RegExp): boolean => {
  return x.source === y.source && x.flags === y.flags;
};

const compareStringObjects = (x: String, y: String): boolean => {
  return x.valueOf() === y.valueOf();
};

const compareNumberObjects = (x: Number, y: Number): boolean => {
  return x.valueOf() === y.valueOf();
};

const compareSpecialObjects = (x: IObjectLike, y: IObjectLike): boolean => {
  const compareFunctions: Array<() => boolean> = [
    (): boolean => x instanceof Date && y instanceof Date && compareDates(x, y),
    (): boolean => x instanceof Number && y instanceof Number && compareNumberObjects(x, y),
    (): boolean => x instanceof String && y instanceof String && compareStringObjects(x, y),
    (): boolean => x instanceof RegExp && y instanceof RegExp && compareRegExps(x, y),
  ];

  return compareFunctions.some((fn: () => boolean) => fn()) || false;
};

const validatePropertyEquality = (xValue: unknown, yValue: unknown): boolean => {
  if (xValue === yValue) {
    return true;
  }

  if (typeof xValue !== 'object') {
    return false;
  }

  return objectsEqual(xValue, yValue);
};

const compareObjectProperties = (x: IObjectLike, y: IObjectLike): boolean => {
  const xKeys = Object.getOwnPropertyNames(x);
  const yKeys = Object.getOwnPropertyNames(y);

  if (xKeys.length !== yKeys.length) {
    return false;
  }

  for (const propertyKey of xKeys) {
    const objY = y as Record<string, unknown>;
    if (!hasOwnProperty(objY, propertyKey)) {
      return false;
    }

    const xValue = (x as Record<string, unknown>)[propertyKey];
    const yValue = objY[propertyKey];

    if (!validatePropertyEquality(xValue, yValue)) {
      return false;
    }
  }

  return true;
};

function objectsEqual(x: unknown, y: unknown): boolean {
  if (x === y) {
    return true;
  }

  // Handle functions by comparing their string representation
  if (typeof x === 'function' && typeof y === 'function') {
    return x.toString() === y.toString();
  }

  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false;
  }

  const objX = x as IObjectLike;
  const objY = y as IObjectLike;

  if (objX.constructor !== objY.constructor) {
    return false;
  }

  if (isSpecialObjectType(objX, objY)) {
    return compareSpecialObjects(objX, objY);
  }

  return compareObjectProperties(objX, objY);
}

const checkArraysEmptyConditions = (
  arr1: unknown[] | null | undefined,
  arr2: unknown[] | null | undefined,
  arr1Length: number,
  arr2Length: number,
): boolean => {
  return (
    (isNullOrUndefined(arr1) && isNullOrUndefined(arr2)) ||
    (isNullOrUndefined(arr1) && arr2Length === 0) ||
    (isNullOrUndefined(arr2) && arr1Length === 0) ||
    (arr1Length === 0 && arr2Length === 0)
  );
};

const isArraysEmpty = (arr1: unknown[] | null | undefined, arr2: unknown[] | null | undefined): boolean => {
  const arr1Length = arr1?.length ?? 0;
  const arr2Length = arr2?.length ?? 0;

  return checkArraysEmptyConditions(arr1, arr2, arr1Length, arr2Length);
};

const checkArraysDifferentLengthConditions = (
  arr1: unknown[] | null | undefined,
  arr2: unknown[] | null | undefined,
  arr1Length: number,
  arr2Length: number,
): boolean => {
  return (
    (isNullOrUndefined(arr1) && arr2Length > 0) ||
    (isNullOrUndefined(arr2) && arr1Length > 0) ||
    arr1Length !== arr2Length
  );
};

const isArraysDifferentLength = (arr1: unknown[] | null | undefined, arr2: unknown[] | null | undefined): boolean => {
  const arr1Length = arr1?.length ?? 0;
  const arr2Length = arr2?.length ?? 0;

  return checkArraysDifferentLengthConditions(arr1, arr2, arr1Length, arr2Length);
};

const getUniqueElements = (sourceArray: unknown[], compareArray: unknown[]): unknown[] => {
  return sourceArray.filter(obj => {
    return !compareArray.some((obj2: unknown) => objectsEqual(obj, obj2));
  });
};

export const arraysEquals = (arr1: unknown[] | null | undefined, arr2: unknown[] | null | undefined): boolean => {
  if (isArraysEmpty(arr1, arr2)) {
    return true;
  }

  if (isArraysDifferentLength(arr1, arr2)) {
    return false;
  }

  const validArr1 = arr1 as unknown[];
  const validArr2 = arr2 as unknown[];

  const uniqueArr1 = getUniqueElements(validArr1, validArr2);
  const uniqueArr2 = getUniqueElements(validArr2, validArr1);

  return validArr1.length === validArr2.length && uniqueArr1.length === 0 && uniqueArr2.length === 0;
};

export const isArray = (array: unknown): boolean => {
  if (isNullOrUndefined(array)) {
    return false;
  }

  return Array.isArray(array);
};

export const isArrayEmpty = (array: unknown): boolean => {
  return isArray(array) && (array as unknown[]).length === 0;
};
