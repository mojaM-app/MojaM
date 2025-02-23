import { IGridData } from '../../../../interfaces/common/grid.data';

export interface IAnnouncementsGridItemColumns {
  validFromDate?: Date;
  state: number;
  createdAt: Date;
  createdBy?: string | null;
  updatedAt?: Date;
  publishedAt?: Date;
  publishedBy?: string | null;
  itemsCount: number;
}

export interface IAnnouncementsGridItemDto extends IAnnouncementsGridItemColumns {
  id: string;
}

export type AnnouncementsGridData = IGridData<IAnnouncementsGridItemDto>;
