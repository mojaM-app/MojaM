import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { PermissionsTree, SystemPermissionValue } from 'src/core/system-permission.enum';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PermissionService } from 'src/services/auth/permission.service';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { IUserPermissions } from '../interfaces/user-permissions.interface';
import { PermissionsService } from '../services/permissions.service';

interface PermissionNode {
  title: string;
  description?: string;
  value: SystemPermissionValue | undefined;
  children?: Array<PermissionNode>;
  autoExpand?: boolean;
  groupName?: string;
}

@Component({
  selector: 'app-permissions-tree',
  imports: [MatTreeModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatCheckboxModule],
  templateUrl: './permissions-tree.component.html',
  styleUrl: './permissions-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsTreeComponent extends WithUnsubscribe() {
  private readonly matTree = viewChildren(MatTree);
  protected readonly permissions = signal<PermissionNode[]>([]);

  public readonly user = input.required<IUserPermissions>();
  public readonly afterPermissionsSaved = output<boolean>();

  private readonly _autoCollapsedPermissionGroups: string[] = ['PermissionsAdministration'];

  public constructor(
    private _translationService: TranslationService,
    private _permissionService: PermissionService,
    private _permissionsService: PermissionsService,
    private _snackBarService: SnackBarService
  ) {
    super();
    this.permissions.set(this.getTreeDataSource());

    effect(() => {
      if (this.matTree()?.length > 0) {
        for (const tree of this.matTree()) {
          tree.expandAll();
          for (const groupName of this._autoCollapsedPermissionGroups) {
            const node = this.permissions().find(n => n.groupName === groupName);
            tree.collapse(node);
          }
        }
      }
    });
  }

  protected handleChangePermission(
    event: MatSlideToggleChange,
    permission: SystemPermissionValue
  ): void {
    this.addSubscription(
      this._permissionsService
        .save(this.user().id, permission, event.checked)
        .subscribe((response: boolean) => {
          if (event.checked) {
            this.user().permissions.push(permission);
          } else {
            const index = this.user().permissions.indexOf(permission);
            if (index > -1) {
              this.user().permissions.splice(index, 1);
            }
          }

          if (response) {
            this._snackBarService.translateAndShowSuccess(
              'Management/Permissions/MsgPermissionSavedSuccessfully',
              { userName: this.user().name }
            );
          } else {
            this._snackBarService.translateAndShowError(
              'Management/Permissions/MsgPermissionSaveFailed',
              { userName: this.user().name }
            );
          }

          this.afterPermissionsSaved.emit(response);
        })
    );
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
          autoExpand: !this._autoCollapsedPermissionGroups.includes(key),
          groupName: key,
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

  protected isToggleDisabled(node: PermissionNode): boolean {
    if (!node.value || this.user().readonlyPermissions.includes(node.value)) {
      return true;
    }

    const permissionGranted = this.user().permissions.includes(node.value);
    if (permissionGranted) {
      return !this._permissionService.hasPermission(SystemPermissionValue.DeletePermission);
    } else {
      return !this._permissionService.hasPermission(SystemPermissionValue.AddPermission);
    }
  }
}
