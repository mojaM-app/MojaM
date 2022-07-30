import { TestBed } from '@angular/core/testing';
import { DeviceDetectorService } from 'ngx-device-detector';

import { DeviceService } from './device.service';

describe('DeviceDetectorService', () => {
  let service: DeviceService;
  let deviceDetectorSpy: jasmine.SpyObj<DeviceDetectorService>;

  beforeEach(() => {
    deviceDetectorSpy =
      jasmine.createSpyObj<DeviceDetectorService>('DeviceDetectorService', [
        'isMobile',
        'isTablet',
      ]);

    TestBed.configureTestingModule({
      providers: [
        DeviceService,
        { provide: DeviceDetectorService, useValue: deviceDetectorSpy },
      ],
    });
    service = TestBed.inject(DeviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#isMobile should return TRUE if DeviceDetectorService.isMobile and DeviceDetectorService.isTablet', () => {
    deviceDetectorSpy.isMobile.and.returnValue(true);
    deviceDetectorSpy.isTablet.and.returnValue(true);
    expect(service.isMobile()).withContext('isMobile=true and isTablet=true').toBeTrue();
  });

  it('#isMobile should return TRUE if DeviceDetectorService.isMobile=true', () => {
    deviceDetectorSpy.isMobile.and.returnValue(true);
    deviceDetectorSpy.isTablet.and.returnValue(false);
    expect(service.isMobile()).withContext('isMobile=true and isTablet=false').toBeTrue();
  });

  it('#isMobile should return TRUE if DeviceDetectorService.isTablet', () => {
    deviceDetectorSpy.isMobile.and.returnValue(false);
    deviceDetectorSpy.isTablet.and.returnValue(true);
    expect(service.isMobile()).withContext('isMobile=false and isTablet').toBeTrue();
  });

  it('#isMobile should return FALSE if !DeviceDetectorService.isMobile and !DeviceDetectorService.isTablet', () => {
    deviceDetectorSpy.isMobile.and.returnValue(false);
    deviceDetectorSpy.isTablet.and.returnValue(false);
    expect(service.isMobile()).withContext('isMobile=false and isTablet=false').toBeFalse();
  });
});
