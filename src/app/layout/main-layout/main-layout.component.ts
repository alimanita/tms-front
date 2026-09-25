import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MenuService, MenuItem } from '../../core/services/menu.service';
import { DatePipe, DecimalPipe, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './main-layout.component.html',
  providers: [ DatePipe, DecimalPipe],
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(MenuService);

  protected readonly user = this.authService.user;
  protected readonly dynamicMenu = this.menuService.menu;

  // Fallback local nav if dynamic menu fails or is empty
  protected readonly fallbackSections = [
    {
      title: 'Pilotage',
      items: [
        { label: 'Tableau de bord', route: '/dashboard', icon: 'dashboard' },
        { label: 'Suivi temps réel', route: '/fleet-tracking', icon: 'sensors' }
      ]
    },
    {
      title: 'Commercial',
      items: [
        { label: 'Clients', route: '/customers', icon: 'people' },
        { label: 'Commandes', route: '/orders', icon: 'receipt_long' }
      ]
    },
    {
      title: 'Gestion Flotte',
      items: [
        { label: 'Véhicules', route: '/fleet/vehicules', icon: 'directions_car' },
        { label: 'Chauffeurs', route: '/fleet/chauffeurs', icon: 'badge' },
        { label: 'Missions', route: '/fleet/missions', icon: 'alt_route' },
        { label: 'Planificateur (TMS)', route: '/fleet/planner', icon: 'route' },
        { label: 'Partenaires', route: '/fleet/partenaires', icon: 'handshake' },
        { label: 'Carburant', route: '/fleet/fuel-fillings', icon: 'local_gas_station' },
        { label: 'Péages', route: '/fleet/tolls', icon: 'toll' },
        { label: 'Dépenses Diverses', route: '/fleet/depenses-diverses', icon: 'receipt' },
        { label: 'Traitement masse IA', route: '/fleet/batch-tickets', icon: 'auto_awesome' },
        { label: 'Entretien', route: '/fleet/maintenances', icon: 'build' },
        { label: 'Pièces détachées', route: '/fleet/pieces-rechange', icon: 'extension' }
      ]
    },
    {
      title: 'Finance & système',
      items: [
        { label: 'Notifications', route: '/fleet/notifications', icon: 'notifications' },
        { label: 'Documents', route: '/fleet/documents', icon: 'description' },
        { label: 'Administration', route: '/admin', icon: 'admin_panel_settings' },
        { label: 'Paramètres', route: '/fleet/settings', icon: 'tune' }
      ]
    }
  ];

  private expandedMap = signal<Record<string, boolean>>({
    fleet: true,
    commercial: true,
    finance_admin: false
  });

  protected readonly sidebarOpen = signal<boolean>(false);
  protected readonly isDarkTheme = signal<boolean>(false);

  ngOnInit(): void {
    this.menuService.loadMenu().subscribe();
    
    // Load theme preference
    const savedTheme = localStorage.getItem('tms-theme');
    if (savedTheme === 'dark') {
      this.isDarkTheme.set(true);
      document.body.classList.add('dark-theme');
    }
  }

  toggleTheme(): void {
    this.isDarkTheme.update(dark => !dark);
    if (this.isDarkTheme()) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('tms-theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('tms-theme', 'light');
    }
  }

  isExpanded(key: string): boolean {
    return this.expandedMap()[key] !== false; // expanded by default unless explicitly false
  }

  toggleExpand(key: string): void {
    this.expandedMap.update(map => ({
      ...map,
      [key]: !this.isExpanded(key)
    }));
  }

  logout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  getPrimaryRoleName(): string {
    const roles = this.user()?.roles;
    if (!roles || roles.length === 0) return '';
    const firstRole: any = roles[0];
    return firstRole.roleName || firstRole;
  }
}
