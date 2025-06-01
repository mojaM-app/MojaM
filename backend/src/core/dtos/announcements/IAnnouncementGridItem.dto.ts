export interface IAnnouncementGridItemDto {
  id: string;
  title: string | null;
  state: number;
  validFromDate: Date | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  publishedAt: Date | null;
  publishedBy: string | null;
  itemsCount: number;
}
