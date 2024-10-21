/* eslint-disable no-use-before-define */
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Announcement } from './announcement.entity';

@Entity({
  name: 'announcement_items',
})
export class AnnouncementItem {
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
