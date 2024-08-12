export interface ILanguageData {
  id: string;
  label: string;
  icon: string;
  messages: () => Promise<Record<string, any>>;
}
