import { DataSource, PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';
import { IAnnouncementGridItemDto } from '../dtos/get-announcement-list.dto';
import { User } from './../../../modules/users/entities/user.entity';
import { toNumber } from './../../../utils/numbers.utils';
import { Announcement } from './announcement.entity';

export const AnnouncementListViewColumns: { [K in keyof IAnnouncementGridItemDto]: string } = {
  id: 'id',
  title: 'title',
  state: 'state',
  validFromDate: 'validFromDate',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  updatedAt: 'updatedAt',
  publishedAt: 'publishedAt',
  publishedBy: 'publishedBy',
  itemsCount: 'itemsCount',
} as const;

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('announcement.Uuid', AnnouncementListViewColumns.id)
      .addSelect('announcement.Title', AnnouncementListViewColumns.title)
      .addSelect('announcement.State', AnnouncementListViewColumns.state)
      .addSelect('announcement.ValidFromDate', AnnouncementListViewColumns.validFromDate)
      .addSelect('announcement.CreatedAt', AnnouncementListViewColumns.createdAt)
      .addSelect("concat(createdBy.FirstName, ' ', createdBy.LastName)", AnnouncementListViewColumns.createdBy)
      .addSelect('announcement.UpdatedAt', AnnouncementListViewColumns.updatedAt)
      .addSelect('announcement.PublishedAt', AnnouncementListViewColumns.publishedAt)
      .addSelect("concat(publishedBy.FirstName, ' ', publishedBy.LastName)", AnnouncementListViewColumns.publishedBy)
      .addSelect('(select count(0) from announcement_items as ai where announcement.Id = ai.AnnouncementId)', AnnouncementListViewColumns.itemsCount)
      .from(Announcement, 'announcement')
      .innerJoin(User, 'createdBy', 'createdBy.id = announcement.CreatedById')
      .leftJoin(User, 'publishedBy', 'publishedBy.id = announcement.PublishedById'),
  name: 'vAnnouncements',
})
export class vAnnouncement implements IAnnouncementGridItemDto {
  @ViewColumn()
  @PrimaryColumn()
  public id: string;

  @ViewColumn()
  public title: string | null;

  @ViewColumn()
  public state: number;

  @ViewColumn({
    transformer: {
      from: (value: string) => (value?.length > 0 ? new Date(value + 'T00:00:00Z') : null),
      to: (value: any) => value,
    },
  })
  public validFromDate: Date | null;

  @ViewColumn()
  public createdAt: Date;

  @ViewColumn()
  public createdBy: string;

  @ViewColumn()
  public updatedAt: Date;

  @ViewColumn()
  public publishedAt: Date | null;

  @ViewColumn()
  public publishedBy: string | null;

  @ViewColumn({
    transformer: {
      from: (value: string) => toNumber(value) ?? 0,
      to: (value: number) => value,
    },
  })
  public itemsCount: number;
}
