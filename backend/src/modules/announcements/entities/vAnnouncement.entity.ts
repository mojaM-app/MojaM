import { DataSource, PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';
import { IAnnouncementGridItemDto } from '../dtos/get-announcement-list.dto';
import { User } from './../../../modules/users/entities/user.entity';
import { Announcement } from './announcement.entity';

export const AnnouncementListViewColumns: { [K in keyof IAnnouncementGridItemDto]: string } = {
  id: 'Id',
  title: 'Title',
  state: 'State',
  validFromDate: 'ValidFromDate',
  createdAt: 'CreatedAt',
  createdBy: 'CreatedBy',
  updatedAt: 'UpdatedAt',
  publishedAt: 'PublishedAt',
  publishedBy: 'PublishedBy',
  itemsCount: 'ItemsCount',
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
  public title?: string;

  @ViewColumn()
  public state: number;

  @ViewColumn()
  public validFromDate?: Date;

  @ViewColumn()
  public createdAt: Date;

  @ViewColumn()
  public createdBy: string;

  @ViewColumn()
  public updatedAt?: Date;

  @ViewColumn()
  public publishedAt: Date;

  @ViewColumn()
  public publishedBy: string;

  @ViewColumn()
  public itemsCount: number;
}
