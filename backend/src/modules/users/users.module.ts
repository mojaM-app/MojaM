import { Container } from 'typedi';
import { type IModule, type IRoutes, type IUpdateUser, type IUserEntity, type IUserService } from '@core';
import { UpdateUserModel } from './models/update-user.model';
import { UserRepository } from './repositories/user.repository';
import { UserDetailsRoute } from './routes/user-details.routes';
import { UserListRoute } from './routes/user-list.routes';
import { UserProfileRoute } from './routes/user-profile.routes';
import { UserRoute } from './routes/user.routes';
import './event-subscribers/logger-events-subscriber';

export class UsersModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new UserRoute(), new UserListRoute(), new UserDetailsRoute(), new UserProfileRoute()];
  }

  public register(): void {
    const repository = Container.get(UserRepository);

    Container.set<IUserService>('IUserService', {
      getIdByUuid(uuid: string | null | undefined): Promise<number | undefined> {
        return repository.getIdByUuid(uuid);
      },
      getByUuid(uuid: string | null | undefined): Promise<IUserEntity | null> {
        return repository.getByUuid(uuid);
      },
      getById(userId: number | undefined): Promise<IUserEntity | null> {
        return repository.getById(userId);
      },
      findManyByLogin(email: string | null | undefined, phone?: string | null | undefined): Promise<IUserEntity[]> {
        return repository.findManyByLogin(email, phone);
      },
      updateAfterLogin(userId: number): Promise<void> {
        return repository.updateAfterLogin(userId);
      },
      increaseFailedLoginAttempts(userId: number, failedAttempts: number): Promise<number> {
        return repository.increaseFailedLoginAttempts(userId, failedAttempts);
      },
      activate(userId: number): Promise<IUserEntity | null> {
        return repository.activate(userId);
      },
      deactivate(userId: number): Promise<IUserEntity | null> {
        return repository.deactivate(userId);
      },
      lockOut(userId: number): Promise<IUserEntity | null> {
        return repository.lockOut(userId);
      },
      unlock(userId: number): Promise<IUserEntity | null> {
        return repository.unlock(userId);
      },
      update(userId: number, model: IUpdateUser): Promise<IUserEntity | null> {
        const updateModel = new UpdateUserModel(userId, model);
        return repository.update(updateModel);
      },
      setPasscode(userId: number, passcode: string): Promise<void> {
        return repository.setPasscode(userId, passcode);
      },
    } satisfies IUserService);
  }
}
