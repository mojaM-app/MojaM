export class NewsMenu {
  public static Label: string = 'SideMenu/News';
  public static Icon: string = 'newspaper';
  public static Path: string = 'news';
}

export class InformationMenu {
  public static Label: string = 'News/Information/Title';
  public static Icon: string = 'newspaper';
  public static Path: string = NewsMenu.Path + '/information';
}

export class CalendarMenu {
  public static Label: string = 'News/Calendar/Title';
  public static Icon: string = 'calendar_month';
  public static Path: string = NewsMenu.Path + '/calendar';
}

export class AnnouncementsMenu {
  public static Label: string = 'News/Announcements/Title';
  public static Icon: string = 'campaign';
  public static Path: string = NewsMenu.Path + '/announcements';
}
