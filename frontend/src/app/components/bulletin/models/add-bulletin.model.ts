import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { BulletinDayDto, BulletinDto } from './bulletin.model';
import { IBulletinForm } from '../bulletin-form/bulletin.form';

export class AddBulletinDto extends BulletinDto {
  public constructor(formControls?: {
    [K in keyof IBulletinForm]: FormControl<any> | FormGroup<any> | FormArray<any>;
  }) {
    super(formControls);
  }

  public static create(): AddBulletinDto {
    return new AddBulletinDto().addDay();
  }

  private addDay(): AddBulletinDto {
    this.days!.push(new BulletinDayDto());
    return this;
  }
}
