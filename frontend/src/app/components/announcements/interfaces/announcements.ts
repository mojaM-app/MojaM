export interface IAnnouncementItem {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string | null;
  updatedAt?: Date;
  updatedBy?: string | null;

  getAuthorName(): string;
  getCreationDateTime(): Date;
}

export interface IAnnouncements {
  id: string;
  title?: string | null;
  state: number;
  validFromDate?: Date | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  publishedAt?: Date | null;
  publishedBy?: string | null;
  items: IAnnouncementItem[];

  getPublisherName(): string;
  getPublishDateTime(): Date | undefined | null;
}
