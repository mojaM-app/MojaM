export interface ILanguageData {
  id: string;
  label: string;
  icon: string;
  messages: () => Promise<{ [key: string]: any }>;
}
