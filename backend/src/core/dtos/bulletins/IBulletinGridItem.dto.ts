export interface IBulletinGridItemDto {
  id: string;
  title: string | null;
  number: string | null;
  date: Date | null;
  state: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  publishedAt: Date | null;
  publishedBy: string | null;
}
