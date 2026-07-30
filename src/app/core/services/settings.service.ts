import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly notify$ = new BehaviorSubject<Record<string, unknown>>({});

  get notify() {
    return this.notify$.asObservable();
  }

  /** Retourne la couleur du thème actuel ('light' | 'dark') */
  getThemeColor(): 'light' | 'dark' {
    const stored = localStorage.getItem('tms-theme') as AppTheme | null;
    const theme = stored ?? 'auto';

    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme === 'dark' ? 'dark' : 'light';
  }

  setTheme(theme: AppTheme): void {
    localStorage.setItem('tms-theme', theme);
    if (this.getThemeColor() === 'dark') {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
    this.notify$.next({ theme });
  }
}
