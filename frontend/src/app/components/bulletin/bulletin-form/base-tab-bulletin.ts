import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogConfig } from '@angular/material/dialog';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { errorNames } from 'src/validators/error-names.const';

export abstract class BaseTabBulletin {
  protected readonly errorNames = errorNames;
  protected readonly maxLengths = VALIDATOR_SETTINGS;

  protected readonly helpDialogConfig: MatDialogConfig = {
    height: '80%',
    width: '60%',
    maxWidth: '100%',
    maxHeight: '100%',
    position: { top: '5%', left: '20%' },
    autoFocus: false,
  } satisfies MatDialogConfig;

  protected getControlErrors(control: AbstractControl): ValidationErrors {
    return control?.errors ?? {};
  }
}
