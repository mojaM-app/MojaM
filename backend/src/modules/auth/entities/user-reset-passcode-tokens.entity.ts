import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, Relation } from 'typeorm';
import { EntityDefaultFunctions } from '../../../dataBase/EntityDefaultFunctions';
import { User } from '../../users/entities/user.entity';
import { ICreateResetPasscodeToken } from '../interfaces/create-reset-passcode-token.interfaces';

@Entity({
  name: 'user_reset_passcode_tokens',
})
export class UserResetPasscodeToken implements ICreateResetPasscodeToken {
  @OneToOne(() => User, (user: User) => user.resetPasscodeToken, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_UserResetPasscodeToken_UserId_To_User',
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
