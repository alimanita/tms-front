import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from 'environments/environments/environment';
import { Observable, catchError, of, tap } from 'rxjs';


export interface MenuItem {
  route: string;
  name: string;
  type: 'link' | 'sub' | 'extLink';
  icon?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.baseUrl;

  readonly menuSignal = signal<MenuItem[]>([]);
  readonly menu = this.menuSignal.asReadonly();

  loadMenu(): Observable<{ menu: MenuItem[] }> {
    return this.http.get<{ menu: MenuItem[] }>(`${this.apiUrl}/auth/menu`).pipe(
      tap((response) => {
        if (response && response.menu) {
          this.menuSignal.set(response.menu);
        }
      }),
      catchError((err) => {
        console.warn('Erreur lors du chargement du menu dynamique, fallback sur menu local.', err);
        return of({ menu: [] });
      })
    );
  }

  /** Get the menu hierarchy / level based on current route array */
  getLevel(routeArr: string[]): string[] {
    const cleanRoute = (r: string) => r.replace(/^\/+|\/+$/g, '');
    const targetPath = routeArr.map(cleanRoute).filter(Boolean).join('/');

    const items = this.menuSignal();
    for (const item of items) {
      if (item.type === 'link' && cleanRoute(item.route) === targetPath) {
        return [item.name];
      }
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          const childRoute = cleanRoute(child.route);
          if (childRoute === targetPath || targetPath.endsWith(childRoute)) {
            return [item.name, child.name];
          }
        }
      }
    }
    return [];
  }
}
