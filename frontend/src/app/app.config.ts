import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  InjectionToken,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideQuillConfig } from 'ngx-quill/config';
import { GlobalErrorHandler } from 'src/core/global-error-handler';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthorizationHeaderInterceptor } from 'src/services/auth/authorization-token.interceptor';
import { DeviceService } from 'src/services/device/device.service';
import { LocalStorageService } from 'src/services/storage/localstorage.service';
import { MatPaginatorTranslations } from 'src/services/translate/component.translations/mat.paginator.translations';
import { TranslationInitService } from 'src/services/translate/translation-init.service';
import { TranslationService } from 'src/services/translate/translation.service';
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
    provideHttpClient(withInterceptorsFromDi()),
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
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    {
      provide: IS_MOBILE,
      useFactory(deviceService: DeviceService): boolean {
        return deviceService.isMobile();
      },
      deps: [DeviceService],
      multi: false,
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { subscriptSizing: 'dynamic' },
    },
    provideNativeDateAdapter(),
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'pl-PL',
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthorizationHeaderInterceptor,
      multi: true,
    },
    {
      provide: MatPaginatorIntl,
      deps: [TranslationService],
      useFactory: (translateService: TranslationService) =>
        new MatPaginatorTranslations(translateService).init(),
    },
    provideQuillConfig({
      modules: {
        syntax: false,
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'], // toggled buttons
          //['blockquote', 'code-block'],

          [{ list: 'ordered' }, { list: 'bullet' }],
          //[{ script: 'sub' }, { script: 'super' }], // superscript/subscript
          //[{ indent: '-1' }, { indent: '+1' }], // outdent/indent

          [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
          //[{ header: [1, 2, 3, 4, 5, 6, false] }],

          [{ color: [] }, { background: [] }], // dropdown with defaults from theme
          //[{ 'font': [] }],
          [{ align: [] }],

          ['clean'], // remove formatting button
        ],
        clipboard: {
          matchers: [
            [
              Node.ELEMENT_NODE,
              (node: any, delta: any): any => {
                const ops: any[] = [];
                delta.ops.forEach((op: any) => {
                  if (op.insert && typeof op.insert === 'string') {
                    ops.push({
                      insert: op.insert,
                    });
                  }
                });
                delta.ops = ops;
                return delta;
              },
            ],
          ],
        },
      },
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
