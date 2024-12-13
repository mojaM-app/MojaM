/* eslint-disable no-use-before-define */
import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ICreateAnnouncement } from '../interfaces/create-announcement.interfaces';
import { IAnnouncementId } from '../interfaces/IAnnouncementId';
import { IUpdateAnnouncement } from '../interfaces/update-announcement.interfaces';
import { IHasGuidId } from './../../../interfaces/IHasGuidId';
import { User } from './../../../modules/users/entities/user.entity';
import { AnnouncementItem } from './announcement-item.entity';

@Entity({
  name: 'announcements',
})
export class Announcement implements IHasGuidId, IAnnouncementId, ICreateAnnouncement, IUpdateAnnouncement {
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_Announcement_Id',
  })
  public id: number;

  @Column({
    name: 'Uuid',
    type: 'varchar',
    length: 36,
    nullable: false,
  })
  @Unique('UQ_Announcement_Uuid', ['uuid'])
  @Generated('uuid')
  public uuid: string;

  @Column({
    name: 'Title',
    type: 'nvarchar',
    length: 255,
    nullable: true,
  })
  public title: string | null;

  @Column({
    name: 'State',
    type: 'int',
    nullable: false,
  })
  public state: number;

  @Column({
    name: 'ValidFromDate',
    type: 'date',
    nullable: true,
    transformer: {
      from: (value: string) => (value?.length > 0 ? new Date(value + 'T00:00:00Z') : null),
      to: (value: Date | null) => value?.toISOString().slice(0, 10), // format the Date to YYYY-MM-DD
    },
  })
  public validFromDate: Date | null;

  @CreateDateColumn({
    name: 'CreatedAt',
    precision: 0,
    nullable: false,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt: Date;

  @ManyToOne(() => User, (user: User) => user.createdAnnouncements, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'CreatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Announcement_CreatedById_To_User',
  })
  @Column({
    name: 'CreatedById',
    type: 'int',
    nullable: false,
  })
  public createdBy: Relation<User>;

  @UpdateDateColumn({
    name: 'UpdatedAt',
    precision: 0,
    nullable: true,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public updatedAt: Date;

  @Column({
    name: 'PublishedAt',
    type: 'timestamp',
    nullable: true,
    precision: 0,
  })
  public publishedAt: Date | null;

  @ManyToOne(() => User, (user: User) => user.publishedAnnouncements, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'PublishedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Announcement_PublishedById_To_User',
  })
  @Column({
    name: 'PublishedById',
    type: 'int',
    nullable: true,
  })
  public publishedBy: Relation<User> | null;

  @OneToMany(() => AnnouncementItem, item => item.announcement)
  public items: Relation<AnnouncementItem[]>;
}
