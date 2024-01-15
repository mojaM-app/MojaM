import { isNullOrUndefined } from './object.utils';

const isNullOrEmptyString = (value: any): boolean => {
  return isNullOrUndefined(value) || isEmptyString(value);
};

const isEmptyString = (value: any): boolean => {
  return isString(value) && value.trim().length === 0;
};

const isString = (value: any): boolean => {
  return typeof value === 'string';
}

export { isEmptyString, isNullOrEmptyString, isString };
