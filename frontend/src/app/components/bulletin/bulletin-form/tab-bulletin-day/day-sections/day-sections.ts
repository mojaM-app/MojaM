import { WysiwygUtils } from 'src/app/components/static/wysiwyg-editor/wysiwyg.utils';
import { SectionType } from '../../../enums/section-type.enum';
import { BulletinDto } from '../../../models/bulletin.model';

export interface IMatOption {
  label: string;
  description: string;
  value: SectionType;
  disabled: boolean;
}

export class DaySections {
  public static getTypes(bulletin?: Partial<BulletinDto> | null | undefined): IMatOption[] {
    return [
      {
        label: 'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/customText',
        description:
          'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/customTextDescription',
        value: SectionType.CUSTOM_TEXT,
        disabled: false,
      },
      {
        label: 'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/introduction',
        description:
          'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/introductionDescription',
        value: SectionType.INTRODUCTION,
        disabled: WysiwygUtils.isEmpty(bulletin?.introduction),
      },
      {
        label: 'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/tipsForWork',
        description:
          'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/tipsForWorkDescription',
        value: SectionType.TIPS_FOR_WORK,
        disabled: WysiwygUtils.isEmpty(bulletin?.tipsForWork),
      },
      {
        label: 'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/dailyPrayer',
        description:
          'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/dailyPrayerDescription',
        value: SectionType.DAILY_PRAYER,
        disabled: WysiwygUtils.isEmpty(bulletin?.dailyPrayer),
      },
    ];
  }

  public static isTitleReadOnly(type: SectionType | null | undefined): boolean {
    return (
      type === SectionType.INTRODUCTION ||
      type === SectionType.DAILY_PRAYER ||
      type === SectionType.TIPS_FOR_WORK
    );
  }

  public static isContentReadOnly(type: SectionType | null | undefined): boolean {
    return (
      type === SectionType.INTRODUCTION ||
      type === SectionType.DAILY_PRAYER ||
      type === SectionType.TIPS_FOR_WORK
    );
  }
}
