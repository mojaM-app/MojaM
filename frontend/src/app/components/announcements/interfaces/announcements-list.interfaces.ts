import { IGridData } from '../../../../interfaces/common/grid.data';

export interface IAnnouncementsGridItemColumns {
  id: string;
  state: number;
  validFromDate?: Date;
  createdAt: Date;
  createdBy?: string;
  updatedAt?: Date;
  publishedAt?: Date;
  publishedBy?: string;
  itemsCount: number;
}

export interface IAnnouncementsGridItemDto extends IAnnouncementsGridItemColumns {}

export type AnnouncementsGridData = IGridData<IAnnouncementsGridItemDto>;
