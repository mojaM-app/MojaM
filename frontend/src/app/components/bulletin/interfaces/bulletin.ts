import { BulletinState } from '../enums/bulletin-state.enum';
import { SectionType } from '../enums/section-type.enum';

export interface IBulletinSectionSettings {
  includeInPdf: boolean;
  expanded: boolean;
}

export interface IBulletinDaySection {
  id: string;
  title: string | null;
  content: string | null;
  type: SectionType;
  order: number;
  settings: IBulletinSectionSettings | null;
  showInPreview: () => boolean;
}

export interface IBulletinDayDto {
  id: string;
  date: Date | null;
  title: string | null;
  sections: IBulletinDaySection[];
}

export interface IBulletin {
  id: string;
  date: Date | null;
  title: string | null;
  state: BulletinState;
  number: number | null;
  introduction: string | null;
  tipsForWork: string | null;
  dailyPrayer: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string | null;
  publishedAt: Date | null;
  publishedBy: string | null;
  days: IBulletinDayDto[];
}
