export interface ICurrentAnnouncementsItem {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface ICurrentAnnouncements {
  id: string;
  title?: string;
  validFromDate: Date;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  publishedAt: Date;
  publishedBy: string | null;
  items: ICurrentAnnouncementsItem[];
}

export interface IGetCurrentAnnouncements {
  currentAnnouncements: ICurrentAnnouncements | null;
  announcementsCount: number;
}
