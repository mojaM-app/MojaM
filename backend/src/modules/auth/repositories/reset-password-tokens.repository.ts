import { RESET_PASSWORD_TOKEN_EXPIRE_IN } from '@config';
import { CryptoService } from '@modules/auth';
import { BaseRepository } from '@modules/common';
import { getDateTimeNow, isNullOrUndefined } from '@utils';
import ms from 'ms';
import Container, { Service } from 'typedi';
import { UserResetPasswordToken } from '../entities/user-reset-password-tokens.entity';
import { ICreateResetPasswordToken } from '../interfaces/create-reset-password-token.interfaces';

@Service()
export class ResetPasswordTokensRepository extends BaseRepository {
  private readonly _cryptoService: CryptoService;

  public constructor() {
    super();
    this._cryptoService = Container.get(CryptoService);
  }

  public async isLastTokenExpired(userId: number): Promise<boolean> {
    const lastToken = await this.getLastToken(userId);

    return this.isTokenExpired(lastToken);
  }

  public isTokenExpired(token: UserResetPasswordToken | null): boolean {
    if (isNullOrUndefined(token)) {
      return true;
    }

    const expirationPeriod: number = ms(RESET_PASSWORD_TOKEN_EXPIRE_IN!);
    const actualDate: number = getDateTimeNow().getTime();
    return actualDate > token!.createdAt.getTime() + expirationPeriod;
  }

  public async createToken(userId: number, token: string): Promise<UserResetPasswordToken> {
    return await this._dbContext.userResetPasswordTokens.save({
      user: { id: userId },
      token,
    } satisfies ICreateResetPasswordToken);
  }

  public async deleteTokens(userId: number): Promise<boolean> {
    const queryBuilder = this._dbContext.userResetPasswordTokens.createQueryBuilder().where('UserId = :userId', { userId });

    const count = await queryBuilder.getCount();

    if (count === 0) {
      return true;
    }

    const deleteResult = await queryBuilder.delete().execute();
    return !isNullOrUndefined(deleteResult);
  }

  public async getLastToken(userId: number): Promise<UserResetPasswordToken | null> {
    const queryBuilder = this._dbContext.userResetPasswordTokens
      .createQueryBuilder()
      .where('UserId = :userId', { userId })
      .orderBy('CreatedAt', 'DESC')
      .take(1);

    return await queryBuilder.getOne();
  }
}
