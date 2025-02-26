export class ObjectUtils {
  public static nameOf<T extends object>(nameExtractor: (obj: T) => any): keyof T {
    const proxy = new Proxy({} as T, {
      get(target, prop: string | symbol): string | symbol {
        return prop;
      },
    });

    return nameExtractor(proxy);
  }
}
