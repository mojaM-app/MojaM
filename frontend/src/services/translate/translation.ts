import { TranslationService } from './translation.service';

export class Translation {
  constructor(
    private value: string | null,
    private init: (() => string) | null
  ) {}

  static FromString(value: string): Translation {
    return new Translation(value, null);
  }

  static FromFormatter(formatter: (...args: any[]) => string, params?: unknown | (() => unknown)): Translation {
    return new Translation(null, () => {
      return typeof params === 'function' ? formatter(params()) : formatter(params);
    });
  }

  static FromService(translate: TranslationService, key: string, params?: unknown | (() => unknown)): Translation {
    return new Translation(null, () => {
      const formatter = translate.getFormatter(key);
      return typeof params === 'function' ? formatter(params()) : formatter(params);
    });
  }

  toString(): string | null {
    if (this.init) {
      this.value = this.init();
      this.init = null;
    }
    return this.value;
  }
}
