import { IAnnouncementsGridItemColumns } from 'src/interfaces/announcements/announcements-list.interfaces';

export const AnnouncementsListColumns: { [K in keyof IAnnouncementsGridItemColumns]: string } = {
  id: 'id',
  state: 'state',
  validFromDate: 'validFromDate',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  updatedAt: 'updatedAt',
  publishedAt: 'publishedAt',
  publishedBy: 'publishedBy',
  itemsCount: 'itemsCount',
} as const;
