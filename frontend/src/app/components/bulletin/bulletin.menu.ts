export class BulletinMenu {
  public static Label = 'Bulletin/Title';
  public static Icon = 'local_library';
  public static Path = 'bulletin';
}

export class BulletinListMenu {
  public static Label = 'Bulletin/BtnList';
  public static Icon = 'table_rows';
  public static Route = 'list';
  public static Path: string = BulletinMenu.Path + '/' + BulletinListMenu.Route;
}

export class AddBulletinMenu {
  public static Label = 'Bulletin/BtnAdd';
  public static Icon = 'add';
  public static Route = 'add';
  public static Path: string = BulletinMenu.Path + '/' + AddBulletinMenu.Route;
}

export class EditBulletinMenu {
  public static Icon = 'edit';
  public static Route = 'edit';
  public static Path: string = BulletinMenu.Path + '/' + EditBulletinMenu.Route;
}

export class PreviewBulletinMenu {
  public static Icon = 'visibility';
  public static Route = 'preview';
  public static Path: string = BulletinMenu.Path + '/' + PreviewBulletinMenu.Route;
}
