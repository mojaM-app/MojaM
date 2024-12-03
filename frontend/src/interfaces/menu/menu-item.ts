import { BottomSheetActionResult } from 'src/app/components/static/bottom-sheet/bottom-sheet.enum';

export interface IMenuItem {
  title?: string;
  icon?: string;
  action?: () => Promise<BottomSheetActionResult | undefined>;
}

export interface ISideMenuItem {
  name: string;
  icon: string;
  route?: string;
  children?: ISideMenuItem[];
  isVisible(): boolean;
}
