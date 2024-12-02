export interface IMenuItem {
  title?: string;
  icon?: string;
  action?: () => void;
}

export interface ISideMenuItem {
  name: string;
  icon: string;
  route?: string;
  children?: ISideMenuItem[];
  isVisible(): boolean;
}
