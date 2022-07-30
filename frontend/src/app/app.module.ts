import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {MatCardModule} from '@angular/material/card';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import { TranslationInitService } from 'src/services/translate/translation-init.service';
import { LocalStorageService } from 'src/services/storage/localstorage.service';
import { PipesModule } from 'src/pipes/pipes.module';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NoopAnimationsModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    PipesModule
  ],
  providers: [
    LocalStorageService,
    {
      provide: APP_INITIALIZER,
      useFactory(translateInit : TranslationInitService){
        return () => translateInit.initializeApp();
      },
      deps: [TranslationInitService],
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
