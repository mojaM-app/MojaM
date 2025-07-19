import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BulletinQuestionTypeType } from '../../../modules/bulletin/enums/bulletin-question-type.enum';

@Entity({
  name: 'bulletin_questions',
})
export class BulletinQuestion {
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_BulletinQuestion_Id',
  })
  public id: number;

  @Column({
    name: 'BulletinDayId',
    type: 'int',
    nullable: false,
  })
  public bulletinDayId: number;

  @Column({
    name: 'UserId',
    type: 'int',
    nullable: false,
  })
  public userId: number;

  @Column({
    name: 'QuestionType',
    type: 'tinyint',
    nullable: false,
  })
  public questionType: BulletinQuestionTypeType;

  @Column({
    name: 'Content',
    type: 'text',
    nullable: false,
  })
  public content: string;

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

  // Computed properties
  public get hasAnswers(): boolean {
    // This will be populated through custom queries
    return false;
  }

  public get canBeEdited(): boolean {
    return !this.hasAnswers;
  }
}
