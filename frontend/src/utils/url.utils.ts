export class UrlUtils {
  public static getMapsAddress(location: string | undefined): string {
    if (!location) {
      return '';
    }

    const encodedLocation = encodeURIComponent(UrlUtils.stripHtml(location));

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      return `comgooglemaps://?daddr=${encodedLocation}&directionsmode=driving`;
    } else if (/Android/.test(navigator.userAgent)) {
      return `google.navigation:q=${encodedLocation}`;
    }

    return `https://maps.google.com/maps?daddr=${encodedLocation}&dirflg=d`;
  }

  private static stripHtml(input: string): string {
    return input
      .replaceAll('<br>', ' ')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('\n', ' ')
      .replaceAll('\r', ' ')
      .replaceAll('\n\r', ' ')
      .replaceAll('<br />', ' ')
      .replaceAll('<br/>', ' ')
      .replace(/<[^>]*>/g, '');
  }
}
