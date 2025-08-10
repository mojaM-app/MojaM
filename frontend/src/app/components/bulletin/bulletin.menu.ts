export class BulletinMenu {
  public static Label = 'Bulletin/Title';
  public static Icon = 'local_library';
  public static Path = 'bulletin';
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
