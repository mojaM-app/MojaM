import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { SectionType } from '../enums/section-type.enum';
import {
  IBulletinDayForm,
  IBulletinDaySectionForm,
  IBulletinForm,
  IBulletinPropertiesForm,
} from '../bulletin-form/bulletin.form';
import { DaySections } from '../bulletin-form/tab-bulletin-day/day-sections/day-sections';

export class BulletinSectionSettingsDto {
  public includeInPdf: boolean = false;
  public expanded: boolean = false;
}

export class BulletinDaySectionDto {
  public id?: string;
  public order: number = 0;
  public type: SectionType = DaySections.defaultSectionType;
  public title: string | null = null;
  public content: string | null = null;
  public settings: BulletinSectionSettingsDto = new BulletinSectionSettingsDto();
}

export class BulletinDayDto {
  public id?: string;
  public date: Date | null = null;
  public title: string | null = null;
  public sections: BulletinDaySectionDto[] = [];
}

export abstract class BulletinDto {
  public date: Date | null = null;
  public title: string | null = null;
  public number: number | null = null;
  public introduction: string | null = null;
  public tipsForWork: string | null = null;
  public dailyPrayer: string | null = null;
  public days: BulletinDayDto[] = [];

  protected constructor(formControls?: {
    [K in keyof IBulletinForm]: FormControl<any> | FormArray<any> | FormGroup<any>;
  }) {
    this.days = [];

    if (formControls) {
      const propertiesFormControls = (formControls.properties as FormGroup<IBulletinPropertiesForm>)
        ?.controls;
      this.date = propertiesFormControls?.date?.value ?? null;
      this.title = propertiesFormControls?.title?.value ?? null;
      this.number = propertiesFormControls?.number?.value ?? null;
      this.introduction = propertiesFormControls?.introduction?.value ?? null;
      this.tipsForWork = propertiesFormControls?.tipsForWork?.value ?? null;
      this.dailyPrayer = propertiesFormControls?.dailyPrayer?.value ?? null;

      const days = formControls.days as FormArray<FormGroup<IBulletinDayForm>>;
      days?.controls?.forEach((day: FormGroup<IBulletinDayForm>) => {
        const sections = day.controls.sections as FormArray<FormGroup<IBulletinDaySectionForm>>;
        this.days!.push({
          id: day.controls.id?.value ?? undefined,
          date: day.controls.date?.value ?? null,
          title: day.controls.title?.value ?? null,
          sections:
            sections?.controls?.map(
              (section: FormGroup<IBulletinDaySectionForm>, index: number) =>
                ({
                  id: section.controls.id?.value ?? undefined,
                  type: section.controls.type?.value ?? DaySections.defaultSectionType,
                  order: index + 1,
                  title: this.getSectionTitle(section),
                  content: this.getSectionContent(section),
                  settings: {
                    includeInPdf: section.controls.settings?.controls.includeInPdf?.value ?? false,
                    expanded: section.controls.settings?.controls.expanded?.value ?? true,
                  },
                }) satisfies BulletinDaySectionDto
            ) ?? [],
        } satisfies BulletinDayDto);
      });
    }
  }

  private getSectionContent(section: FormGroup<IBulletinDaySectionForm>): string | null {
    if (DaySections.isContentReadOnly(section.controls.type?.value)) {
      return null;
    }

    return section.controls.content?.value ?? null;
  }

  private getSectionTitle(section: FormGroup<IBulletinDaySectionForm>): string | null {
    if (DaySections.isTitleReadOnly(section.controls.type?.value)) {
      return null;
    }

    return section.controls.title?.value ?? null;
  }
}
