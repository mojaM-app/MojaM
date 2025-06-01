import { IUpdateUser, IUserModuleBoundary } from '@core';
import { Service } from 'typedi';
import { UpdateUserModel } from './models/update-user.model';
import { UserRepository } from './repositories/user.repository';
import { User } from '../../dataBase/entities/users/user.entity';

@Service()
export class UserModuleBoundary implements IUserModuleBoundary {
  constructor(private readonly _userRepository: UserRepository) {}
  public async getIdByUuid(uuid: string | undefined): Promise<number | undefined> {
    return this._userRepository.getIdByUuid(uuid);
  }

  public async getById(userId: number | undefined): Promise<User | null> {
    return this._userRepository.getById(userId);
  }

  public async getByUuid(uuid: string | undefined): Promise<User | null> {
    return this._userRepository.getByUuid(uuid);
  }

  public async findManyByLogin(email: string | null | undefined, phone?: string | null | undefined): Promise<User[]> {
    return this._userRepository.findManyByLogin(email, phone);
  }

  public async updateAfterLogin(userId: number): Promise<void> {
    return this._userRepository.updateAfterLogin(userId);
  }

  public async increaseFailedLoginAttempts(userId: number, failedAttempts: number): Promise<number> {
    return this._userRepository.increaseFailedLoginAttempts(userId, failedAttempts);
  }

  public async activate(userId: number): Promise<User | null> {
    return this._userRepository.activate(userId);
  }

  public async deactivate(userId: number): Promise<User | null> {
    return this._userRepository.deactivate(userId);
  }

  public async lockOut(userId: number): Promise<User | null> {
    return this._userRepository.lockOut(userId);
  }

  public async unlock(userId: number): Promise<User | null> {
    return this._userRepository.unlock(userId);
  }

  public async update(userId: number, model: IUpdateUser): Promise<User | null> {
    const updateModel = new UpdateUserModel(userId, model);
    return this._userRepository.update(updateModel);
  }

  public async setPasscode(userId: number, passcode: string): Promise<void> {
    return this._userRepository.setPasscode(userId, passcode);
  }
}
