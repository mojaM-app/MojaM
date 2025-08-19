import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { BulletinDayDto, BulletinDaySectionDto, BulletinDto } from './bulletin.model';
import {
  IBulletinDayForm,
  IBulletinDaySectionForm,
  IBulletinForm,
  IBulletinPropertiesForm,
} from '../bulletin-form/bulletin.form';
import { WysiwygUtils } from '../../static/wysiwyg-editor/wysiwyg.utils';
import { SectionType } from '../enums/section-type.enum';

export class AddBulletinDto extends BulletinDto {
  public constructor(formControls?: {
    [K in keyof IBulletinForm]: FormControl<any> | FormArray<any> | FormGroup<any>;
  }) {
    super();
    this.days = [];

    if (formControls) {
      const propertiesFormControls = (formControls.properties as FormGroup<IBulletinPropertiesForm>)
        ?.controls;
      this.date = propertiesFormControls?.date?.value ?? null;
      this.title = propertiesFormControls?.title?.value ?? null;
      this.number = propertiesFormControls?.number?.value ?? null;
      this.introduction = WysiwygUtils.clearContent(
        propertiesFormControls?.introduction?.value ?? null
      );
      this.tipsForWork = WysiwygUtils.clearContent(
        propertiesFormControls?.tipsForWork?.value ?? null
      );
      this.dailyPrayer = WysiwygUtils.clearContent(
        propertiesFormControls?.dailyPrayer?.value ?? null
      );

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
                  type: section.controls.type?.value ?? SectionType.CUSTOM_TEXT,
                  order: index,
                  title: section.controls.title?.value ?? null,
                  content: section.controls.content?.value ?? null,
                }) satisfies BulletinDaySectionDto
            ) ?? [],
        } satisfies BulletinDayDto);
      });
    }
  }

  public static create(): AddBulletinDto {
    return new AddBulletinDto().addDay();
  }

  private addDay(): AddBulletinDto {
    this.days!.push(new BulletinDayDto());
    return this;
  }
}
