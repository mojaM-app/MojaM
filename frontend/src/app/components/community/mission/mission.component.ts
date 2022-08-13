import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-community-mission',
  templateUrl: './mission.component.html',
  styleUrls: ['./mission.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionComponent implements OnInit {
  content: string | null = null;
  public constructor() {}

  public ngOnInit(): void {}
}
