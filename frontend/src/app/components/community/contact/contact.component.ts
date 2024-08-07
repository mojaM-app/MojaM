import { ChangeDetectionStrategy, Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-community-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  get communityEmail(): string {
    return environment.communityEmail;
  }
  get communityWebPage(): string {
    return environment.communityWebPage;
  }
  get communityPhone(): string {
    return environment.communityPhone;
  }
  get communityAddress(): string {
    return environment.communityAddress;
  }
}
