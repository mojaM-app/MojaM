import { IHasGuidId } from '../IHasGuidId';
import { IAnnouncementId } from './IAnnouncement.Id';

export interface IAnnouncementEntity extends IAnnouncementId, IHasGuidId {}
