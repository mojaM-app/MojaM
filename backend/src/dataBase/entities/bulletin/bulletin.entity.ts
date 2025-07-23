import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BulletinState, BulletinStateType } from '../../../modules/bulletin/enums/bulletin-state.enum';
import { User } from '../users/user.entity';
import { IBulletinEntity, ICreateBulletin, IUpdateBulletin } from './../../../core/interfaces';

@Entity({
  name: 'bulletins',
})
export class Bulletin implements IBulletinEntity, ICreateBulletin, IUpdateBulletin {
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_Bulletin_Id',
  })
  public id: number;

  @Column({
    name: 'Uuid',
    type: 'varchar',
    length: 36,
    nullable: false,
  })
  @Unique('UQ_Bulletin_Uuid', ['uuid'])
  @Generated('uuid')
  public uuid: string;

  @Column({
    name: 'Title',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  public title: string | null;

  @Column({
    name: 'StartDate',
    type: 'date',
    nullable: true,
  })
  public startDate: Date | null;

  @Column({
    name: 'DaysCount',
    type: 'int',
    nullable: false,
    default: 7,
  })
  public daysCount: number;

  @Column({
    name: 'State',
    type: 'tinyint',
    nullable: false,
    default: BulletinState.Draft,
  })
  public state: BulletinStateType;

  @ManyToOne(() => User, (user: User) => user.createdAnnouncements, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'CreatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Bulletin_CreatedById_To_User',
  })
  @Column({
    name: 'CreatedById',
    type: 'int',
    nullable: false,
  })
  public createdBy: Relation<User>;

  @ManyToOne(() => User, (user: User) => user.publishedAnnouncements, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'ModifiedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Bulletin_ModifiedById_To_User',
  })
  @Column({
    name: 'ModifiedById',
    type: 'int',
    nullable: true,
  })
  public modifiedBy: Relation<User> | null;

  @ManyToOne(() => User, (user: User) => user.publishedAnnouncements, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'PublishedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Bulletin_PublishedById_To_User',
  })
  @Column({
    name: 'PublishedById',
    type: 'int',
    nullable: true,
  })
  public publishedBy: Relation<User> | null;

  @CreateDateColumn({
    name: 'CreatedAt',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt: Date;

  @UpdateDateColumn({
    name: 'ModifiedAt',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public modifiedAt: Date;

  @Column({
    name: 'PublishedAt',
    type: 'timestamp',
    nullable: true,
  })
  public publishedAt: Date | null;

  // Computed properties
  public get isPublished(): boolean {
    return this.state === BulletinState.Published;
  }

  public get isDraft(): boolean {
    return this.state === BulletinState.Draft;
  }

  public get endDate(): Date {
    const endDate = new Date(this.startDate);
    endDate.setDate(endDate.getDate() + this.daysCount - 1);
    return endDate;
  }

  public getDayDate(dayNumber: number): Date {
    if (dayNumber < 1 || dayNumber > this.daysCount) {
      throw new Error(`Day number must be between 1 and ${this.daysCount}`);
    }
    const dayDate = new Date(this.startDate);
    dayDate.setDate(dayDate.getDate() + dayNumber - 1);
    return dayDate;
  }

  public isDateInRange(date: Date): boolean {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startDateOnly = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
    const endDateOnly = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate());

    return dateOnly >= startDateOnly && dateOnly <= endDateOnly;
  }
}
