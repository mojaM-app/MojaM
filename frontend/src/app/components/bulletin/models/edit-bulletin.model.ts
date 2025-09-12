import { FormGroup, FormArray, FormControl } from '@angular/forms';
import { IBulletinForm } from '../bulletin-form/bulletin.form';
import { IBulletin } from '../interfaces/bulletin';
import { BulletinDayDto, BulletinDaySectionDto, BulletinDto } from './bulletin.model';
import { DaySections } from '../bulletin-form/tab-bulletin-day/day-sections/day-sections';

export class EditBulletinDto extends BulletinDto {
  public readonly id: string;

  public constructor(
    id: string,
    formControls?: {
      [K in keyof IBulletinForm]: FormControl<any> | FormGroup<any> | FormArray<any>;
    }
  ) {
    super(formControls);
    this.id = id;
  }

  public static create(bulletin: IBulletin): EditBulletinDto {
    const result = new EditBulletinDto(bulletin.id);
    result.title = bulletin.title ?? null;
    result.date = bulletin.date ?? null;
    result.number = bulletin.number ?? null;
    result.introduction = bulletin.introduction ?? null;
    result.tipsForWork = bulletin.tipsForWork ?? null;
    result.dailyPrayer = bulletin.dailyPrayer ?? null;
    result.days = bulletin.days.map(
      day =>
        ({
          id: day.id,
          date: day.date ?? null,
          title: day.title ?? null,
          sections:
            day.sections?.map(
              (section: any) =>
                ({
                  id: section.id,
                  order: section.order,
                  type: section.type,
                  title: section.title ?? null,
                  content: section.content ?? null,
                  settings: {
                    includeInPdf:
                      section.settings?.includeInPdf ??
                      DaySections.isIncludeInPdfByDefault(section.type),
                    expanded:
                      section.settings?.expanded ?? DaySections.isExpandedByDefault(section.type),
                  },
                }) satisfies BulletinDaySectionDto
            ) ?? [],
        }) satisfies BulletinDayDto
    );
    return result;
  }
}
