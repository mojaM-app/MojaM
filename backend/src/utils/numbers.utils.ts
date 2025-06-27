const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    if (isFinite(value)) {
      return value + 0;
    }
    return null;
  }

  if (typeof value === 'string') {
    let strValue = value.trim();
    if (strValue.length === 0) {
      return null;
    }

    strValue = strValue.replace(',', '.').replace(/\s/gu, '');

    return toNumber(Number(strValue));
  }

  return null;
};

const isNumber = (value: unknown): boolean => {
  return toNumber(value) !== null;
};

const isPositiveNumber = (value: unknown): boolean => {
  return (toNumber(value) ?? 0) > 0;
};

export { isNumber, isPositiveNumber, toNumber };
