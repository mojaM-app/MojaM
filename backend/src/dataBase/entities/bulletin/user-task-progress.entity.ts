import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({
  name: 'user_task_progress',
})
export class UserTaskProgress {
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_UserTaskProgress_Id',
  })
  public id: number;

  @Column({
    name: 'UserId',
    type: 'int',
    nullable: false,
  })
  public userId: number;

  @Column({
    name: 'TaskId',
    type: 'int',
    nullable: false,
  })
  public taskId: number;

  @Column({
    name: 'IsCompleted',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public isCompleted: boolean;

  @Column({
    name: 'Comment',
    type: 'text',
    nullable: true,
  })
  public comment: string | null;

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
}
