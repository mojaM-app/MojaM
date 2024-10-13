import { NumbersUtils } from '../../utils/numbers.utils';

export abstract class StorageService {
  public saveObject(storageKey: string, object: unknown): void {
    if (object) {
      this.saveString(storageKey, JSON.stringify(object));
    } else {
      this.removeItem(storageKey);
    }
  }

  public loadObject(storageKey: string): unknown {
    const data = this.loadString(storageKey);
    if (data) {
      return JSON.parse(data);
    }

    return null;
  }

  public saveDate(storageKey: string, dateToSave: Date): void {
    if (dateToSave instanceof Date) {
      this.saveNumber(storageKey, dateToSave.getTime());
    } else if (dateToSave) {
      this.saveDate(storageKey, new Date(dateToSave));
    } else {
      this.removeItem(storageKey);
    }
  }

  public loadDate(storageKey: string): Date | null {
    const data = this.loadNumber(storageKey);
    if (data) {
      return new Date(data);
    }
    return null;
  }

  public saveNumber(storageKey: string, numberToSave: number | null): void {
    if (typeof numberToSave === 'number') {
      this.saveString(storageKey, numberToSave.toString());
    } else if (numberToSave) {
      this.saveNumber(storageKey, NumbersUtils.parse(numberToSave));
    } else {
      this.removeItem(storageKey);
    }
  }

  public loadNumber(storageKey: string): number | null {
    const data = this.loadString(storageKey);
    if (data) {
      return NumbersUtils.parse(data);
    }
    return null;
  }

  public saveBoolean(storageKey: string, valueToSave: boolean | null): void {
    switch (valueToSave) {
      case false:
        this.setItemValue(storageKey, 'false');
        break;
      case true:
        this.setItemValue(storageKey, 'true');
        break;
      default:
        this.setItemValue(storageKey, null);
        break;
    }
  }

  public loadBoolean(storageKey: string): boolean | null {
    switch (this.getItemValue(storageKey)) {
      case 'false':
        return false;
      case 'true':
        return true;
      default:
        return null;
    }
  }

  public saveString(storageKey: string, stringToSave: string): void {
    this.setItemValue(storageKey, stringToSave);
  }

  public loadString(storageKey: string): string | null {
    return this.getItemValue(storageKey);
  }

  public abstract isItemSet(storageKey: string): boolean;
  public abstract removeItem(storageKey: string): void;
  protected abstract setItemValue(storageKey: string, stringToSave: string | null): void;
  protected abstract getItemValue(storageKey: string): string | null;
}
