import { SectionType } from '../../../enums/section-type.enum';

export class DaySections {
  public static getTypes(): { label: string; description: string; value: SectionType }[] {
    return [
      {
        label: 'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/customText',
        description:
          'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/customTextDescription',
        value: SectionType.CUSTOM_TEXT,
      },
      {
        label: 'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/introduction',
        description:
          'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/introductionDescription',
        value: SectionType.INTRODUCTION,
      },
      {
        label: 'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/tipsForWork',
        description:
          'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/tipsForWorkDescription',
        value: SectionType.TIPS_FOR_WORK,
      },
      {
        label: 'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/dailyPrayer',
        description:
          'Bulletin/Form/TabBulletinDay/AddSectionDialog/SectionTypes/dailyPrayerDescription',
        value: SectionType.DAILY_PRAYER,
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
