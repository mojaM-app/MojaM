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
  title?: string;
  state: number;
  validFromDate?: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  publishedAt?: Date;
  publishedBy?: string;
  items: IAnnouncementItem[];
}
