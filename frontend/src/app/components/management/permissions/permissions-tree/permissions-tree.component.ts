import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTreeModule, MatTreeNode } from '@angular/material/tree';
import { PermissionsTree, SystemPermissionValue } from 'src/core/system-permission.enum';
import { TranslationService } from 'src/services/translate/translation.service';
import { IUserPermissions } from '../interfaces/user-permissions.interface';

interface PermissionNode {
  title: string;
  description?: string;
  value: SystemPermissionValue | undefined;
  children?: Array<PermissionNode>;
  autoExpand?: boolean;
}

@Component({
  selector: 'app-permissions-tree',
  imports: [MatTreeModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatCheckboxModule],
  templateUrl: './permissions-tree.component.html',
  styleUrl: './permissions-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsTreeComponent {
  private readonly nodes = viewChildren(MatTreeNode);
  protected readonly permissions = signal<PermissionNode[]>([]);

  public readonly user = input.required<IUserPermissions>();

  public constructor(private _translationService: TranslationService) {
    this.permissions.set(this.getTreeDataSource());

    effect(() => {
      if (this.nodes()) {
        for (const node of this.nodes()) {
          if ((node.data as PermissionNode).autoExpand) {
            node.expand();
          }
        }
      }
    });
  }

  protected childrenAccessor(node: PermissionNode): PermissionNode[] {
    return node.children ?? [];
  }

  protected hasChild(_: number, node: PermissionNode): boolean {
    return (node?.children?.length ?? 0) > 0;
  }

  protected getTreeDataSource(): PermissionNode[] {
    const result: PermissionNode[] = [];

    const tree = PermissionsTree.getPermissionsTree();

    for (const key in tree) {
      if (Object.prototype.hasOwnProperty.call(tree, key)) {
        const translationKey = `Permissions/${key}`;
        const node = {
          title: this._translationService.get(`${translationKey}/Title`),
          description: this._translationService.get(`${translationKey}/Description`),
          value: undefined,
          children: [],
          autoExpand: key === 'AnnouncementsAdministration',
        } satisfies PermissionNode;

        const permissions = tree[key];
        for (const permission of permissions) {
          const translationKey = `Permissions/${key}/Permissions/${SystemPermissionValue[permission]}`;
          const childNode = {
            title: this._translationService.get(`${translationKey}/Title`),
            description: this._translationService.get(`${translationKey}/Description`),
            value: permission,
          } satisfies PermissionNode;

          (node.children as Array<PermissionNode>).push(childNode);
        }

        result.push(node);
      }
    }

    return result;
  }
}
