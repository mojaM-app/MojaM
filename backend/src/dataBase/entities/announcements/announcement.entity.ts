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
import { AnnouncementItem } from './announcement-item.entity';
import { IAnnouncementEntity, ICreateAnnouncement, IUpdateAnnouncement } from '../../../core/interfaces';
import { EntityDefaultFunctions } from '../../EntityDefaultFunctions';
import { EntityTransformFunctions } from '../../EntityTransformFunctions';
import { User } from '../users/user.entity';

@Entity({
  name: 'announcements',
})
export class Announcement implements IAnnouncementEntity, ICreateAnnouncement, IUpdateAnnouncement {
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
      from: EntityTransformFunctions.stringDateToDate,
      to: EntityTransformFunctions.dateToStringDate,
    },
  })
  public validFromDate: Date | null;

  @CreateDateColumn({
    name: 'CreatedAt',
    precision: 0,
    nullable: false,
    type: 'timestamp',
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision0,
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
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision0,
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
