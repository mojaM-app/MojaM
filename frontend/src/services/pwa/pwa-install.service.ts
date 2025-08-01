import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private _deferredPrompt: any = null;
  private readonly _canInstall$ = new BehaviorSubject<boolean>(false);
  private readonly _isInstalled$ = new BehaviorSubject<boolean>(false);
  private readonly _isStandalone$ = new BehaviorSubject<boolean>(false);

  public constructor() {
    this.initializeService();
  }

  public get canInstall(): Observable<boolean> {
    return this._canInstall$.asObservable();
  }

  public get isInstalled(): Observable<boolean> {
    return this._isInstalled$.asObservable();
  }

  public get isStandalone(): Observable<boolean> {
    return this._isStandalone$.asObservable();
  }

  public get shouldShowInstallPrompt(): Observable<boolean> {
    return this._canInstall$.pipe(map(canInstall => canInstall && !this._isStandalone$.value));
  }

  public async promptInstall(): Promise<boolean> {
    if (!this._deferredPrompt) {
      return false;
    }

    try {
      const result = await this._deferredPrompt.prompt();
      const userChoice = await result.userChoice;

      if (userChoice === 'accepted') {
        this._canInstall$.next(false);
        this._deferredPrompt = null;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error during PWA installation:', error);
      return false;
    }
  }

  public isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  public isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  public shouldShowIOSInstructions(): boolean {
    return (
      this.isIOSDevice() &&
      this.isSafari() &&
      !this._isStandalone$.value &&
      !this._canInstall$.value
    );
  }

  public dismissInstallPrompt(): void {
    this._canInstall$.next(false);
    this._deferredPrompt = null;
  }

  private initializeService(): void {
    // Check if app is already installed (standalone mode)
    this.checkStandaloneMode();

    // Listen for beforeinstallprompt event
    this.listenForInstallPrompt();

    // Listen for app installed event
    this.listenForAppInstalled();

    // Check if PWA is installed via related applications
    this.checkIfInstalled();
  }

  private checkStandaloneMode(): void {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this._isStandalone$.next(isStandalone);
  }

  private listenForInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this._deferredPrompt = e;
      this._canInstall$.next(true);
    });
  }

  private listenForAppInstalled(): void {
    window.addEventListener('appinstalled', () => {
      this._isInstalled$.next(true);
      this._canInstall$.next(false);
      this._deferredPrompt = null;
    });
  }

  private async checkIfInstalled(): Promise<void> {
    if ('getInstalledRelatedApps' in navigator) {
      try {
        const relatedApps = await (navigator as any).getInstalledRelatedApps();
        this._isInstalled$.next(relatedApps.length > 0);
      } catch (error) {
        console.warn('Could not check installed related apps:', error);
      }
    }
  }
}
