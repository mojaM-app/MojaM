import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { DialogService } from 'src/services/dialog/dialog.service';
import { AnnouncementItemBase } from '../announcement-item.base';

@Component({
  selector: 'app-announcement-item-desktop',
  standalone: true,
  imports: [PipesModule, DirectivesModule, FormsModule],
  templateUrl: './announcement-item-desktop.component.html',
  styleUrl: './announcement-item-desktop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementItemDesktopComponent extends AnnouncementItemBase {
  public constructor(private _dialogService: DialogService) {
    super();
  }

  public override editItem(): void {
    //const content = this.array(this.formControlNames.items).at(index).value.content;
    // const dialogRef = this._dialogService.openWysiwygEditor(content);
    // dialogRef.afterClosed().subscribe(result => {
    //   console.log(`Dialog result: ${result}`);
    // });
    // this.array(this.formControlNames.items).at(index).patchValue({
    //   editing: true,
    // });
  }
}
