import { IAnnouncementsGridItemColumns } from 'src/app/components/announcements/interfaces/announcements-list.interfaces';

export const AnnouncementsListColumns: { [K in keyof IAnnouncementsGridItemColumns]: string } = {
  state: 'state',
  validFromDate: 'validFromDate',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  updatedAt: 'updatedAt',
  publishedAt: 'publishedAt',
  publishedBy: 'publishedBy',
  itemsCount: 'itemsCount',
} as const;
