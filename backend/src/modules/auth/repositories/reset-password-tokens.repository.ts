import { RESET_PASSWORD_TOKEN_EXPIRE_IN } from '@config';
import { CryptoService } from '@modules/auth';
import { BaseRepository } from '@modules/common';
import { isNullOrUndefined, toNumber } from '@utils';
import Container, { Service } from 'typedi';
import { UserResetPasswordToken } from '../entities/user-reset-password-tokens.entity';

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

    const expirationPeriod = toNumber(RESET_PASSWORD_TOKEN_EXPIRE_IN)! * 60 * 1000;
    return new Date().getTime() > (token!.createdAt.getTime() + expirationPeriod);
  }

  public async createToken(userId: number, token: string): Promise<UserResetPasswordToken> {
    return await this._dbContext.userResetPasswordTokens.save({
      user: { id: userId },
      token,
    });
  }

  public async deleteTokens(userId: number): Promise<boolean> {
    const queryBuilder = this._dbContext.userResetPasswordTokens
      .createQueryBuilder()
      .where('UserId = :userId', { userId });

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
