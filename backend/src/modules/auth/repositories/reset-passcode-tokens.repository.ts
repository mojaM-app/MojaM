import { RESET_PASSWORD_TOKEN_EXPIRE_IN } from '@config';
import { ICreateResetPasscodeToken, IUserId } from '@core';
import { BaseRepository } from '@db';
import { getDateTimeNow, isNullOrUndefined } from '@utils';
import ms from 'ms';
import { Service } from 'typedi';
import { UserResetPasscodeToken } from './../../../dataBase/entities/users/user-reset-passcode-tokens.entity';

@Service()
export class ResetPasscodeTokensRepository extends BaseRepository {
  constructor() {
    super();
  }

  public async isLastTokenExpired(userId: number): Promise<boolean> {
    const lastToken = await this.getLastToken(userId);

    return this.isTokenExpired(lastToken);
  }

  public isTokenExpired(token: UserResetPasscodeToken | null): boolean {
    if (isNullOrUndefined(token)) {
      return true;
    }

    const expirationPeriod: number = ms(RESET_PASSWORD_TOKEN_EXPIRE_IN!);
    const actualDate: number = getDateTimeNow().getTime();
    return actualDate > token!.createdAt.getTime() + expirationPeriod;
  }

  public async createToken(userId: number, token: string): Promise<UserResetPasscodeToken> {
    return await this._dbContext.userResetPasscodeTokens.save({
      user: { id: userId } satisfies IUserId,
      token,
    } satisfies ICreateResetPasscodeToken);
  }

  public async deleteTokens(userId: number): Promise<boolean> {
    const queryBuilder = this._dbContext.userResetPasscodeTokens.createQueryBuilder().where('UserId = :userId', { userId });

    const count = await queryBuilder.getCount();

    if (count === 0) {
      return true;
    }

    const deleteResult = await queryBuilder.delete().execute();
    return !isNullOrUndefined(deleteResult);
  }

  public async getLastToken(userId: number): Promise<UserResetPasscodeToken | null> {
    const queryBuilder = this._dbContext.userResetPasscodeTokens
      .createQueryBuilder()
      .where('UserId = :userId', { userId })
      .orderBy('CreatedAt', 'DESC')
      .take(1);

    return await queryBuilder.getOne();
  }
}
