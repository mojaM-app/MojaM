/* eslint-disable @typescript-eslint/no-extraneous-class */

import { TransformFnParams } from 'class-transformer';

export abstract class DtoTransformFunctions {
  public static emptyStringToNull = (params: TransformFnParams): string | null => {
    return params.value === '' ? null : params.value;
  };
}
