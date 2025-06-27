import { type IHasGuidId } from '../IHasGuidId';
import { type IAnnouncementId } from './IAnnouncement.Id';

export interface IAnnouncementEntity extends IAnnouncementId, IHasGuidId {}
