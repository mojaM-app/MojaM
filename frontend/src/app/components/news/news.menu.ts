export class NewsMenu {
  public static Label = 'News/Title';
  public static Icon = 'newspaper';
  public static Path = 'news';
}

export class InformationMenu {
  public static Label = 'News/Information/Title';
  public static Icon = 'newspaper';
  public static Route = 'information';
  public static Path: string = NewsMenu.Path + '/' + InformationMenu.Route;
}

export class CalendarMenu {
  public static Label = 'News/Calendar/Title';
  public static Icon = 'calendar_month';
  public static Route = 'calendar';
  public static Path: string = NewsMenu.Path + '/' + CalendarMenu.Route;
}

export class AnnouncementsMenu {
  public static Label = 'News/Announcements/Title';
  public static Icon = 'campaign';
  public static Route = 'announcements';
  public static Path: string = NewsMenu.Path + '/' + AnnouncementsMenu.Route;
}
