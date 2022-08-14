import { Guid } from 'guid-typescript';

export class GuidUtils {
  public static isUUID(value: string): boolean {
    if (!value || !value.length || value.length < 32 || value.length > 38) {
      return false;
    }

    const regex =
      /^[0-9a-fA-F]{8}\-{0,1}[0-9a-fA-F]{4}\-{0,1}[0-9a-fA-F]{4}\-{0,1}[0-9a-fA-F]{4}\-{0,1}[0-9a-fA-F]{12}$/;
    return regex.exec(value) != null;
  }

  public static isEmptyGuid(value: string): boolean {
    if (!this.isUUID(value)) {
      return false;
    }

    return value === Guid.EMPTY;
  }

  public static new() : string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
