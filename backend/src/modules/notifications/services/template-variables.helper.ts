/* eslint-disable n/no-callback-literal */

import { TPL_VAR_APP_NAME, TPL_VAR_CONTACT_EMAIL, TPL_VAR_CONTACT_PHONE, TPL_VAR_CONTACT_WEBSITE } from '@config';

export class TemplateVariablesHelper {
  public static get(): Record<string, string> {
    return {
      appName: TPL_VAR_APP_NAME!,
      contactEmail: TPL_VAR_CONTACT_EMAIL!,
      contactPhone: TPL_VAR_CONTACT_PHONE!,
      contactWebsite: TPL_VAR_CONTACT_WEBSITE!,
    };
  }
}
