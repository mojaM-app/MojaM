import { type IUserId } from '../users/IUser.Id';

export interface ICreateBulletin {
  createdBy: IUserId;
  title: string | null;
  startDate: Date | null;
  daysCount: number;
}
