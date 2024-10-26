/* eslint-disable no-use-before-define */
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from 'typeorm';
import { ICreateAnnouncementItem } from '../interfaces/create-announcement.interfaces';
import { User } from './../../../modules/users/entities/user.entity';
import { Announcement } from './announcement.entity';

@Entity({
  name: 'announcement_items',
})
export class AnnouncementItem implements ICreateAnnouncementItem {
  @PrimaryGeneratedColumn('uuid', {
    name: 'Id',
    primaryKeyConstraintName: 'PK_AnnouncementItem_Id',
  })
  public id: string;

  @Index('IXD_AnnouncementItem_Content_Fulltext', { fulltext: true })
  @Column({
    name: 'Content',
    type: 'text',
    nullable: true,
  })
  public content: string;

  @CreateDateColumn({
    name: 'CreatedAt',
    precision: 0,
    nullable: false,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
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
    precision: 0,
    nullable: true,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public updatedAt?: Date;

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
  public updatedBy?: Relation<User>;

  @ManyToOne(() => Announcement, announcement => announcement.items,
    { onDelete: 'RESTRICT', onUpdate: 'RESTRICT', })
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
