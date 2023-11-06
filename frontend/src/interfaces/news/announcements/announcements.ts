export interface IGetAnnouncementsResponse {
  data: IAnnouncements;
  message: string;
}

export interface IAnnouncements {
  date: Date;
  announcements: string[];
}
