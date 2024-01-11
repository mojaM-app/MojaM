/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

const arraysEquals = (arr1: any[] | null, arr2: any[] | null): boolean => {
  if ((!arr1 && !arr2) || (!arr1 && !arr2?.length) || (!arr2 && !arr1?.length) || (!arr1?.length && !arr2?.length)) {
    return true;
  } else if ((!arr1 && arr2?.length) || (!arr2 && arr1?.length) || arr1?.length !== arr2?.length) {
    return false;
  }

  const uniqueArr1 = arr1.filter(obj => {
    return !arr2.some(obj2 => {
      return objectsEqual(obj, obj2);
    });
  });

  const uniqueArr2 = arr2.filter(obj => {
    return !arr1.some(obj2 => {
      return objectsEqual(obj, obj2);
    });
  });

  return arr1.length === arr2.length && uniqueArr1.length === 0 && uniqueArr2.length === 0;
};

const objectsEqual = (x: any, y: any): boolean => {
  if (x === y) {
    return true;
  }

  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false;
  }

  if (x.constructor !== y.constructor) {
    return false;
  }

  if (
    (typeof x === 'function' && typeof y === 'function') ||
    (x instanceof Date && y instanceof Date) ||
    (x instanceof RegExp && y instanceof RegExp) ||
    (x instanceof String && y instanceof String) ||
    (x instanceof Number && y instanceof Number)
  ) {
    return x.toString() === y.toString();
  }

  for (const p in x) {
    if (!x.hasOwnProperty(p)) {
      continue;
    }

    if (!y.hasOwnProperty(p)) {
      return false;
    }

    if (x[p] === y[p]) {
      continue;
    }

    if (typeof x[p] !== 'object') {
      return false;
    }

    if (!objectsEqual(x[p], y[p])) {
      return false;
    }
  }

  for (const p in y) {
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
      return false;
    }
  }

  return true;
};

export { arraysEquals };
