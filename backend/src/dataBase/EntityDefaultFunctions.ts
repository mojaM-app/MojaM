/* eslint-disable @typescript-eslint/no-extraneous-class */

export abstract class EntityDefaultFunctions {
  public static defaultCurrentTimestampPrecision0 = (): string => 'CURRENT_TIMESTAMP';
  public static defaultCurrentTimestampPrecision3 = (): string => 'CURRENT_TIMESTAMP(3)';
}
