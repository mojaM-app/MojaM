import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'bulletin_question_answers',
})
export class BulletinQuestionAnswer {
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_BulletinQuestionAnswer_Id',
  })
  public id: number;

  @Column({
    name: 'QuestionId',
    type: 'int',
    nullable: false,
  })
  public questionId: number;

  @Column({
    name: 'UserId',
    type: 'int',
    nullable: false,
  })
  public userId: number;

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
}
