/**
 * Shared route constants that can be used across modules without creating circular dependencies
 */
export class RouteConstants {
  // Auth routes
  public static readonly AUTH_RESET_PASSCODE = 'reset-passcode';

  // Bulletin routes
  public static readonly BULLETIN_PATH = '/bulletin';
  public static readonly BULLETIN_PUBLISH_PATH = 'publish';

  // Announcement routes
  public static readonly ANNOUNCEMENTS_PATH = '/announcements';
  public static readonly ANNOUNCEMENTS_PUBLISH_PATH = 'publish';

  // Current announcements routes
  public static readonly CURRENT_ANNOUNCEMENTS_PATH = `${RouteConstants.ANNOUNCEMENTS_PATH}/current`;

  // Notification routes
  public static readonly NOTIFICATIONS_PATH = '/notifications';
}
