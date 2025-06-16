import { IUserEntity } from './IUserEntity';
import { IUpdateUser } from './update-user.interfaces';

export interface IUserService {
  getIdByUuid(uuid: string | null | undefined): Promise<number | undefined>;
  getByUuid(uuid: string | null | undefined): Promise<IUserEntity | null>;
  getById(userId: number | undefined): Promise<IUserEntity | null>;
  findManyByLogin(email: string | null | undefined, phone?: string | null | undefined): Promise<IUserEntity[]>;
  updateAfterLogin(userId: number): Promise<void>;
  increaseFailedLoginAttempts(userId: number, failedAttempts: number): Promise<number>;
  lockOut(userId: number): Promise<IUserEntity | null>;
  unlock(userId: number): Promise<IUserEntity | null>;
  activate(userId: number): Promise<IUserEntity | null>;
  deactivate(userId: number): Promise<IUserEntity | null>;
  update(userId: number, model: IUpdateUser): Promise<IUserEntity | null>;
  setPasscode(userId: number, passcode: string): Promise<void>;
}
