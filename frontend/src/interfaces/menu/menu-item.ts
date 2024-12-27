import { MenuItemClickResult } from 'src/interfaces/menu/menu.enum';

export interface IMenuItem {
  title?: string;
  icon?: string;
  action?: () => Promise<MenuItemClickResult | undefined>;
}

export interface ISideMenuItem {
  name: string;
  icon: string;
  route?: string;
  children?: ISideMenuItem[];
  isVisible(): boolean;
}
