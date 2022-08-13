import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-community-diaconie',
  templateUrl: './diaconie.component.html',
  styleUrls: ['./diaconie.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaconieComponent implements OnInit {
  public constructor() {}

  public ngOnInit(): void {}
}
