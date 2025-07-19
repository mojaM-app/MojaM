import { Column, CreateDateColumn, Entity, Generated, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { BulletinState, BulletinStateType } from '../../../modules/bulletin/enums/bulletin-state.enum';

@Entity({
  name: 'bulletins',
})
export class Bulletin {
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
    type: 'nvarchar',
    length: 500,
    nullable: false,
  })
  public title: string;

  @Column({
    name: 'StartDate',
    type: 'date',
    nullable: false,
  })
  public startDate: Date;

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

  @Column({
    name: 'CreatedBy',
    type: 'int',
    nullable: false,
  })
  public createdBy: number;

  @Column({
    name: 'ModifiedBy',
    type: 'int',
    nullable: true,
  })
  public modifiedBy: number | null;

  @Column({
    name: 'PublishedBy',
    type: 'int',
    nullable: true,
  })
  public publishedBy: number | null;

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
