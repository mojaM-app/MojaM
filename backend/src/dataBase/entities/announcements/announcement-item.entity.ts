import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Announcement } from './announcement.entity';
import { ICreateAnnouncementItem, IUpdateAnnouncementItem } from '../../../core/interfaces';
import { EntityDefaultFunctions } from '../../EntityDefaultFunctions';
import { User } from '../users/user.entity';

@Entity({
  name: 'announcement_items',
})
export class AnnouncementItem implements ICreateAnnouncementItem, IUpdateAnnouncementItem {
  @PrimaryGeneratedColumn('uuid', {
    name: 'Id',
    primaryKeyConstraintName: 'PK_AnnouncementItem_Id',
  })
  public id: string;

  @Index('IXD_AnnouncementItem_Content_Fulltext', { fulltext: true })
  @Column({
    name: 'Content',
    type: 'text',
    nullable: false,
  })
  public content: string;

  @Column({
    name: 'Order',
    type: 'int',
    nullable: false,
  })
  public order: number;

  @CreateDateColumn({
    name: 'CreatedAt',
    precision: 3,
    nullable: false,
    type: 'timestamp',
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision3,
  })
  public createdAt: Date;

  @ManyToOne(() => User, (user: User) => user.createdAnnouncementItems, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'CreatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_AnnouncementItem_CreatedById_To_User',
  })
  @Column({
    name: 'CreatedById',
    type: 'int',
    nullable: false,
  })
  public createdBy: Relation<User>;

  @UpdateDateColumn({
    name: 'UpdatedAt',
    precision: 3,
    nullable: true,
    type: 'timestamp',
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision3,
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  public updatedAt: Date;

  @ManyToOne(() => User, (user: User) => user.updatedAnnouncementItems, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'UpdatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_AnnouncementItem_UpdatedById_To_User',
  })
  @Column({
    name: 'UpdatedById',
    type: 'int',
    nullable: true,
  })
  public updatedBy: Relation<User> | undefined;

  @ManyToOne(() => Announcement, announcement => announcement.items, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'AnnouncementId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Announcement_To_AnnouncementItem',
  })
  @Column({
    name: 'AnnouncementId',
    type: 'int',
    nullable: false,
  })
  public announcement: Relation<Announcement>;
}
