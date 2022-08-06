import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-community-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnInit {
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

  constructor() { }

  ngOnInit(): void {
  }

}
