import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { TranslationInitService } from 'src/services/translate/translation-init.service';
import { LocalStorageService } from 'src/services/storage/localstorage.service';
import { PipesModule } from 'src/pipes/pipes.module';
import { NotFoundComponent } from './components/static/not-found/not-found.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DirectivesModule } from 'src/directives/directives.module';

@NgModule({
  declarations: [AppComponent, HeaderComponent, FooterComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    PipesModule,
    DirectivesModule,
    NotFoundComponent,
    HttpClientModule,
  ],
  providers: [
    LocalStorageService,
    {
      provide: APP_INITIALIZER,
      useFactory(translateInit: TranslationInitService) {
        return () => translateInit.initializeApp();
      },
      deps: [TranslationInitService],
      multi: true,
    },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
