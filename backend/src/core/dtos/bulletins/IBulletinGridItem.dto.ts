export interface IBulletinGridItemDto {
  id: string;
  title: string | null;
  number: number | null;
  date: Date | null;
  state: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string | null;
  publishedAt: Date | null;
  publishedBy: string | null;
}
