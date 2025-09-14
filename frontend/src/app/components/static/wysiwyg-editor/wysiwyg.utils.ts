import { StringUtils } from 'src/utils/string.utils';

export class WysiwygUtils {
  public static clearContent(content: string | null | undefined): string {
    return (content ?? '')
      .replace(/(<p><\/p>\s*)+$/, '')
      .replace(/&nbsp;+/gi, ' ')
      .trim()
      .replace(/\s+/gi, ' ')
      .replace(/^\s/gi, '');
  }

  /**
   * Replaces conjunctions/short prepositions with a non-breaking space after them.
   *
   * @param content - input text
   * @param useHtmlEntity - if true (default) insert "&nbsp;", if false -> insert NBSP character (\u00A0)
   */
  public static fixConjunctions(content: string | null | undefined, useHtmlEntity = true): string {
    if (!content) return '';

    const nbsp = useHtmlEntity ? '&nbsp;' : '\u00A0';
    const conjunctions = new Set(['i', 'a', 'o', 'u', 'w', 'z', 'św', 'ks']);

    const tokens = content.match(/\S+|\s+/gu) || [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (/^\s+$/u.test(token)) {
        continue; // whitespace
      }

      const stripped = token.replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}]+$/u, '');

      const normalized = stripped.toLowerCase();

      if (conjunctions.has(normalized)) {
        if (i + 1 < tokens.length && /^\s+$/u.test(tokens[i + 1])) {
          const ws = tokens[i + 1];
          // replace the first space (or other whitespace) with NBSP/&#160;
          tokens[i + 1] = nbsp + ws.slice(1);
        } else if (i + 1 >= tokens.length) {
          // conjunction at the end of the string — nothing to do
        } else {
          // no whitespace (e.g. strange case) — inject NBSP as a separate token
          tokens.splice(i + 1, 0, nbsp);
        }
      }
    }

    return tokens.join('');
  }

  public static isEmpty(content: string | null | undefined): boolean {
    return !content || StringUtils.isEmpty(WysiwygUtils.clearContent(content));
  }
}
