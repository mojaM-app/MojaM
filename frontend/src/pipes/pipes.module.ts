import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DateAgoPipe } from './date-ago.pipe';
import { GdatePipe } from './gdate.pipe';
import { GdatetimePipe } from './gdatetime.pipe';
import { GmessagePipe } from './gmessage.pipe';
import { GnumberPipe } from './gnumber.pipe';
import { GtimePipe } from './gtime.pipe';
import { YesNoPipe } from './yes_no.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    GdatePipe,
    GdatetimePipe,
    GmessagePipe,
    GnumberPipe,
    GtimePipe,
    DateAgoPipe,
    YesNoPipe,
  ],
  exports: [GdatePipe, GdatetimePipe, GmessagePipe, GnumberPipe, GtimePipe, DateAgoPipe, YesNoPipe],
})
export class PipesModule {}
