import { GridData } from '../common/grid.data';

export interface IAnnouncementsGridItemColumns {
  id: string;
  state: number;
  validFromDate?: Date;
  createdAt: Date;
  createdBy?: string;
}

export interface IAnnouncementsGridItemDto extends IAnnouncementsGridItemColumns {
  updatedAt?: Date;
  publishedAt?: Date;
  publishedBy?: string;
  itemsCount: number;
}

export type AnnouncementsGridData = GridData<IAnnouncementsGridItemDto>;
