import { IBulletinGridItemColumns } from '../interfaces/bulletin-list.interfaces';

export const BULLETIN_LIST_COLUMNS: { [K in keyof IBulletinGridItemColumns]: string } = {
  title: 'title',
  number: 'number',
  date: 'date',
  state: 'state',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  updatedAt: 'updatedAt',
  updatedBy: 'updatedBy',
  publishedAt: 'publishedAt',
  publishedBy: 'publishedBy',
} as const;
