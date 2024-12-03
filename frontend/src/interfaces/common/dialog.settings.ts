export interface IDialogSettings {
  title?: string;
  message: { text: string; interpolateParams?: unknown };
  yesBtnText?: string;
  noBtnText?: string;
}
