/* eslint-disable no-use-before-define */
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, Relation } from 'typeorm';
import { ICreateResetPasswordToken } from '../interfaces/create-reset-password-token.interfaces';
import { EntityDefaultFunctions } from './../../../dataBase/EntityDefaultFunctions';
import { User } from './../../users/entities/user.entity';

@Entity({
  name: 'user_reset_password_tokens',
})
export class UserResetPasswordToken implements ICreateResetPasswordToken {
  @OneToOne(() => User, (user: User) => user.resetPasswordToken, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_UserResetPasswordToken_UserId_To_User',
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
  public token: string;

  @CreateDateColumn({
    name: 'CreatedAt',
    nullable: false,
    precision: 0,
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision0,
    type: 'timestamp',
  })
  public createdAt: Date;
}
