import { StorageService } from './storage.service';

export class SessionStorageService extends StorageService {
  public isItemSet(storageKey: string): boolean {
    return storageKey !== null && storageKey?.length > 0 && storageKey in sessionStorage;
  }

  public removeItem(storageKey: string): void {
    if (!this.isItemSet(storageKey)) {
      return;
    }
    sessionStorage.removeItem(storageKey);
  }

  protected setItemValue(storageKey: string, stringToSave: string | null): void {
    if (!storageKey || !storageKey.length) {
      return;
    }

    if (stringToSave === null || typeof stringToSave === 'undefined') {
      sessionStorage.removeItem(storageKey);
    } else {
      sessionStorage.setItem(storageKey, stringToSave);
    }
  }

  protected getItemValue(storageKey: string): string | null {
    if (!this.isItemSet(storageKey)) {
      return null;
    }
    return sessionStorage.getItem(storageKey);
  }
}
