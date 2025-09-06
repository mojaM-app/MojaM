export class WysiwygUtils {
  public static clearContent(content: string | null | undefined): string {
    return (content ?? '')
      .replace(/(<p><\/p>\s*)+$/, '')
      .replace(/&nbsp;+/gi, ' ')
      .trim()
      .replace(/\s+/gi, ' ')
      .replace(/^\s/gi, '');
  }

  public static fixConjunctions(content: string | null | undefined): string {
    const conjunctions = ['i', 'a', 'o', 'u', 'w', 'z', 'św\\.', 'ks\\.'];
    const input = (content ?? '').trim();
    const regex = new RegExp(`(^|\\s)(${conjunctions.join('|')})\\s+`, 'gi');
    return input.replace(regex, `$1$2&nbsp;`);
  }
}
