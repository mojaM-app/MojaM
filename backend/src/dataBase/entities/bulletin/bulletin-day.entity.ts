import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'bulletin_days',
})
export class BulletinDay {
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_BulletinDay_Id',
  })
  public id: number;

  @Column({
    name: 'BulletinId',
    type: 'int',
    nullable: false,
  })
  public bulletinId: number;

  @Column({
    name: 'DayNumber',
    type: 'int',
    nullable: false,
  })
  public dayNumber: number;

  @Column({
    name: 'Introduction',
    type: 'text',
    nullable: true,
  })
  public introduction: string | null;

  @Column({
    name: 'Instructions',
    type: 'text',
    nullable: false,
  })
  public instructions: string;

  // Computed properties
  public get hasIntroduction(): boolean {
    return this.introduction !== null && this.introduction.trim().length > 0;
  }
}
