export interface IMenuItem {
  name: string;
  icon: string;
  route?: string;
  children?: IMenuItem[];
  isVisible(): boolean;
}
