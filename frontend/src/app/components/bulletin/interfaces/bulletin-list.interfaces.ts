import { IGridData } from '../../../../core/interfaces/common/grid.data';

export interface IBulletinGridItemColumns {
  title?: string | null;
  number?: string | null;
  date?: Date | null;
  state: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string | null;
  publishedAt?: Date | null;
  publishedBy?: string | null;
}

export interface IBulletinGridItemDto extends IBulletinGridItemColumns {
  id: string;
}

export type BulletinGridData = IGridData<IBulletinGridItemDto>;
