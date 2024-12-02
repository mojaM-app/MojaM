export interface ISideMenuItem {
  name: string;
  icon: string;
  route?: string;
  children?: ISideMenuItem[];
  isVisible(): boolean;
}
