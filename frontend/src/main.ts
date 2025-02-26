import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import moment from 'moment';
import 'moment/locale/pl';
moment.locale('pl');

bootstrapApplication(AppComponent, appConfig).catch(err => console?.error(err));
