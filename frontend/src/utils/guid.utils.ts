import { Guid } from 'guid-typescript';

export class GuidUtils {
  /**
   * This method is used to check whether the given value is a valid GUID and not empty GUID.
   * @param value  value to check
   * @returns True if the value is a valid GUID and not empty GUID, otherwise false.
   */
  public static isValidGuid(value: any): boolean {
    if (value === null || value === undefined || value === Guid.EMPTY) {
      return false;
    }

    return Guid.isGuid(value) && !Guid.parse(value).isEmpty();
  }

  public static create(): string {
    return Guid.raw();
  }
}
