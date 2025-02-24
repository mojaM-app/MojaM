export class ManagementMenu {
  public static Label = 'Management/Title';
  public static Icon = 'settings';
  public static Path = 'management';
}

export class ManagementMenuUserList {
  public static Label = 'Management/UserList/Title';
  public static Icon = 'people';
  public static Route = 'user-list';
  public static Path = ManagementMenu.Path + '/' + ManagementMenuUserList.Route;
}

export class ManagementMenuAddUser {
  public static Route = 'user/add';
  public static Path = ManagementMenu.Path + '/' + ManagementMenuAddUser.Route;
}

export class ManagementMenuEditUser {
  public static Route = 'user/edit';
  public static Path = ManagementMenu.Path + '/' + ManagementMenuEditUser.Route;
}

export class ManagementMenuMyProfile {
  public static Label = 'Management/UserProfile/Title';
  public static Route = 'my-profile';
  public static Path = ManagementMenu.Path + '/' + ManagementMenuMyProfile.Route;
}

export class ManagementMenuPermissions {
  public static Label = 'Management/Permissions/Title';
  public static Icon = 'vpn_key';
  public static Route = 'permissions';
  public static Path = ManagementMenu.Path + '/' + ManagementMenuPermissions.Route;
}
