/**
 * Enum for system permission values.
 * If you add a new permission, you should add it here and in the PermissionsTree class.
 */
export enum SystemPermissionValue {
  PreviewUserList = 100,
  PreviewUserDetails = 101,
  AddUser = 102,
  EditUser = 103,
  DeactivateUser = 104,
  ActivateUser = 105,
  DeleteUser = 106,
  UnlockUser = 107,

  AddPermission = 200,
  DeletePermission = 201,

  PreviewAnnouncementsList = 300,
  AddAnnouncements = 301,
  EditAnnouncements = 302,
  DeleteAnnouncements = 303,
  PublishAnnouncements = 304,

  PreviewLogList = 400,

  PreviewBulletinList = 500,
  AddBulletin = 501,
  EditBulletin = 502,
  DeleteBulletin = 503,
  PublishBulletin = 504,
  AnswerBulletinQuestion = 505,
}

/**
 * The key is the permission group name and the value is the list of permissions.
 * The key should be the same as the permission group name from translation file.
 * If you add a new permission group or a new permission, you should update translations frontend\public\i18n\pl.json
 */
export class PermissionsTree {
  public static getPermissionsTree(): Record<any, SystemPermissionValue[]> {
    const tree: Record<any, SystemPermissionValue[]> = {
      AnnouncementsAdministration: [
        SystemPermissionValue.PreviewAnnouncementsList,
        SystemPermissionValue.AddAnnouncements,
        SystemPermissionValue.EditAnnouncements,
        SystemPermissionValue.DeleteAnnouncements,
        SystemPermissionValue.PublishAnnouncements,
      ],
      UsersAdministration: [
        SystemPermissionValue.PreviewUserList,
        SystemPermissionValue.PreviewUserDetails,
        SystemPermissionValue.AddUser,
        SystemPermissionValue.EditUser,
        SystemPermissionValue.DeactivateUser,
        SystemPermissionValue.ActivateUser,
        SystemPermissionValue.DeleteUser,
        SystemPermissionValue.UnlockUser,
      ],
      PermissionsAdministration: [
        SystemPermissionValue.AddPermission,
        SystemPermissionValue.DeletePermission,
      ],
    };

    return tree;
  }
}
