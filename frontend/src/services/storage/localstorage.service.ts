import { StorageService } from './storage.service';

export class LocalStorageService extends StorageService {
  public isItemSet(storageKey: string): boolean {
    return storageKey && storageKey.length && storageKey in localStorage;
  }

  public removeItem(storageKey: string): void {
    if (!this.isItemSet(storageKey)) {
      return;
    }
    localStorage.removeItem(storageKey);
  }

  protected setItemValue(storageKey: string, stringToSave: string): void {
    if (!storageKey || !storageKey.length) {
      return;
    }

    if (stringToSave === null || typeof stringToSave === 'undefined') {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, stringToSave);
    }
  }

  protected getItemValue(storageKey: string): string | null {
    if (!this.isItemSet(storageKey)) {
      return null;
    }
    return localStorage.getItem(storageKey);
  }
}
