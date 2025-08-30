export class AnnouncementsMenu {
  public static Label = 'Announcements/Title';
  public static Icon = 'campaign';
  public static Route = 'announcements';
  public static Path: string = AnnouncementsMenu.Route;
}

export class AddAnnouncementsMenu {
  public static Label = 'Announcements/BtnAdd';
  public static Icon = 'add';
  public static Route = 'add';
  public static Path: string = AnnouncementsMenu.Path + '/' + AddAnnouncementsMenu.Route;
}

export class EditAnnouncementsMenu {
  public static Label = 'Announcements/BtnEdit';
  public static Icon = 'edit';
  public static Route = 'edit';
  public static Path: string = AnnouncementsMenu.Path + '/' + EditAnnouncementsMenu.Route;
}

export class AnnouncementsListMenu {
  public static Label = 'Announcements/BtnList';
  public static Icon = 'table_rows';
  public static Route = 'list';
  public static Path: string = AnnouncementsMenu.Path + '/' + AnnouncementsListMenu.Route;
}

export class PreviewAnnouncementsMenu {
  public static Label = 'Announcements/BtnPreview';
  public static Icon = 'open_in_new';
  public static Route = 'preview';
  public static Path: string = AnnouncementsMenu.Path + '/' + PreviewAnnouncementsMenu.Route;
}
