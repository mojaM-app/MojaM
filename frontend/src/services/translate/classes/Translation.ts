import { TranslationService } from '../translation.service';

export class Translation {
  public constructor(
    private value: string | null,
    private init: (() => string) | null
  ) {}

  public static FromString(value: string): Translation {
    return new Translation(value, null);
  }

  public static FromFormatter(formatter: (...args: unknown[]) => string, params?: unknown | (() => unknown)): Translation {
    return new Translation(null, () => {
      return typeof params === 'function' ? formatter(params()) : formatter(params);
    });
  }

  public static FromService(translate: TranslationService, key: string, params?: unknown | (() => unknown)): Translation {
    return new Translation(null, () => {
      const formatter = translate.getFormatter(key);
      return typeof params === 'function' ? formatter(params()) : formatter(params);
    });
  }

  public toString(): string | null {
    if (this.init) {
      this.value = this.init();
      this.init = null;
    }
    return this.value;
  }
}
