import { ChangeDetectionStrategy, Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-community-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  public get communityEmail(): string {
    return environment.communityEmail;
  }
  public get communityWebPage(): string {
    return environment.communityWebPage;
  }
  public get communityPhone(): string {
    return environment.communityPhone;
  }
  public get communityAddress(): string {
    return environment.communityAddress;
  }
}
