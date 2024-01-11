/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable eqeqeq */

const toNumber = (value: any): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    if (isFinite(value)) {
      return value + 0;
    } else {
      return null;
    }
  }

  if (typeof value === 'string') {
    if (!(value + '').trim().length) {
      return null;
    }

    value = (value + '').trim().replace(',', '.').replace(/\s/g, '');

    return value == value * 1 ? toNumber(value * 1) : null;
  }

  return null;
}

const isNumber = (value: any): boolean => {
  return toNumber(value) !== null;
}

export { isNumber, toNumber };
