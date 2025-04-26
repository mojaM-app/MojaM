import { isString } from '@utils';
import { TransformFnParams } from 'class-transformer';

export abstract class DtoTransformFunctions {
  /**
   * Trim string and return null if string is empty
   */
  public static trimAndReturnNullIfEmpty = (params: TransformFnParams): string | null => {
    if (isString(params.value)) {
      const trimmedValue = (params.value as string).trim();
      return trimmedValue.length === 0 ? null : trimmedValue;
    }

    return params.value;
  };

  /**
   * Return null if value is empty string
   */
  public static returnNullIfEmpty = (params: TransformFnParams): string | null => {
    return params.value === '' ? null : params.value;
  };

  /**
   * Return empty string if value is null or undefined
   */
  public static getEmptyStringIfNotSet = (params: TransformFnParams): string => {
    return params.value === null || params.value === undefined ? '' : params.value;
  };
}
