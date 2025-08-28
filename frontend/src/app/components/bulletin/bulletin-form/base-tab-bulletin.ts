import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogConfig } from '@angular/material/dialog';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { errorNames } from 'src/validators/error-names.const';

export abstract class BaseTabBulletin {
  protected readonly errorNames = errorNames;
  protected readonly maxLengths = VALIDATOR_SETTINGS;

  protected getControlErrors(control: AbstractControl): ValidationErrors {
    return control?.errors ?? {};
  }

  protected getDialogConfig(isMobile: boolean): MatDialogConfig {
    if (isMobile) {
      return {
        restoreFocus: false,
        height: 'calc(100% - 10px)',
        width: 'calc(100% - 10px)',
        maxWidth: '100%',
        maxHeight: '100%',
        position: { top: '5px', left: '5px' },
        autoFocus: false,
      } satisfies MatDialogConfig;
    } else {
      return {
        restoreFocus: false,
        height: '80%',
        width: '60%',
        maxWidth: '100%',
        maxHeight: '100%',
        position: { top: '5%', left: '20%' },
        autoFocus: false,
      } satisfies MatDialogConfig;
    }
  }
}
