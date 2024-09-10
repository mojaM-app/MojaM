/* eslint-disable no-use-before-define */
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, Relation } from 'typeorm';
import { User } from './../../users/entities/user.entity';

@Entity({
  name: 'user_reset_password_tokens',
})
export class UserResetPasswordToken {
  @OneToOne(() => User, (user: User) => user.resetPasswordToken,
    { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_UserResetPasswordToken_To_User_UserId',
  })
  @PrimaryColumn({
    name: 'UserId',
    type: 'int',
    nullable: false,
  })
  public user: Relation<User>;

  @Column({
    name: 'Token',
    type: 'nvarchar',
    length: 64,
    nullable: false,
  })
    token: string;

  @CreateDateColumn({
    name: 'CreatedAt',
    nullable: false,
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
    type: 'timestamp',
  })
    createdAt: Date;
}
