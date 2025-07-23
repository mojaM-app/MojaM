import { type IHasGuidId } from '../IHasGuidId';
import { type IBulletinId } from './IBulletin.Id';

export interface IBulletinEntity extends IBulletinId, IHasGuidId {}
