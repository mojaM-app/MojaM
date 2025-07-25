import { isUUID } from 'class-validator';
import { isNullOrUndefined } from './object.utils';
import { isEmptyString } from './strings.utils';

const isGuid = (value: unknown): boolean => {
  if (isNullOrUndefined(value) || isEmptyString(value)) {
    return false;
  }

  return isUUID(value);
};

export { isGuid };
