export class WysiwygUtils {
  public static clearContent(content: string | null | undefined): string {
    return (content ?? '')
      .replace(/(<p><\/p>\s*)+$/, '')
      .replace(/&nbsp;+/gi, ' ')
      .trim()
      .replace(/\s+/gi, ' ')
      .replace(/^\s/gi, '');
  }
}
