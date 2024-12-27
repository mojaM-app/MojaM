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

export class ManagementMenuEditUser {
  public static Route = 'user';
  public static Path = ManagementMenu.Path + '/' + ManagementMenuEditUser.Route;
}
