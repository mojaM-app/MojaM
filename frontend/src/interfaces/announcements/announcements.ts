export interface ICurrentAnnouncementsItem {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface ICurrentAnnouncements {
  id: string;
  title?: string;
  validFromDate: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  publishedAt: Date;
  publishedBy: string;
  items: ICurrentAnnouncementsItem[];
}
