import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-community-mission',
  templateUrl: './mission.component.html',
  styleUrls: ['./mission.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
