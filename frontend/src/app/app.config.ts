import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
  InjectionToken,
  provideZoneChangeDetection,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { DirectivesModule } from 'src/directives/directives.module';
import { HttpErrorInterceptor } from 'src/interceptors/error.interceptor';
import { PipesModule } from 'src/pipes/pipes.module';
import { DeviceService } from 'src/services/device/device.service';
import { LocalStorageService } from 'src/services/storage/localstorage.service';
import { TranslationInitService } from 'src/services/translate/translation-init.service';
import { routes } from './app.routes';

export const IS_MOBILE = new InjectionToken<boolean>('isMobile');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    importProvidersFrom(
      MatToolbarModule,
      MatButtonModule,
      MatIconModule,
      MatCardModule,
      MatToolbarModule,
      MatIconModule,
      MatButtonModule,
      MatSidenavModule,
      MatSlideToggleModule,
      PipesModule,
      DirectivesModule
    ),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true,
    },
    {
      provide: IS_MOBILE,
      useFactory(deviceService: DeviceService) {
        return deviceService.isMobile();
      },
      deps: [DeviceService],
      multi: false,
    },
  ],
};
