/**
 * Shared route constants that can be used across modules without creating circular dependencies
 */
export class RouteConstants {
  // Auth routes
  public static readonly AUTH_RESET_PASSCODE = 'reset-passcode';
  public static readonly AUTH_PATH = '/auth';
  public static readonly AUTH_LOGIN_PATH = '/login';
  public static readonly AUTH_GET_ACCOUNT_BEFORE_LOG_IN_PATH = `${RouteConstants.AUTH_PATH}/get-account-before-log-in`;

  // User routes
  public static readonly USER_PATH = '/user';
  public static readonly USER_ACTIVATE_PATH = 'activate';
  public static readonly USER_DEACTIVATE_PATH = 'deactivate';

  //User details routes
  public static readonly USER_DETAILS_PATH = '/user-details';

  // Announcement routes
  public static readonly ANNOUNCEMENTS_PATH = '/announcements';

  // Notification routes
  public static readonly NOTIFICATIONS_PATH = '/notifications';

  // Permission routes
  public static readonly PERMISSIONS_PATH = '/permissions';
}
