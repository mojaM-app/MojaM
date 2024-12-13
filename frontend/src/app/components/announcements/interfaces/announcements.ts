export interface IAnnouncementItem {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface IAnnouncements {
  id: string;
  title: string | null;
  state: number;
  validFromDate: Date | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  publishedAt?: Date;
  publishedBy?: string;
  items: IAnnouncementItem[];
}
