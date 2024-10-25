import { Service } from 'typedi';
import { BaseUserRepository } from './base.user.repository';

@Service()
export class UserProfileRepository extends BaseUserRepository {
  public constructor() {
    super();
  }
}
