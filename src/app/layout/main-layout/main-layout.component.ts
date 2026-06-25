import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './main-layout.component.html',
  providers: [AuthService, DatePipe, DecimalPipe],
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);

  protected readonly user = this.authService.user;

  protected readonly navSections: NavSection[] = [
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
        { label: 'Achats Amazon', route: '/amazon-purchases', icon: 'shopping_cart' },
        { label: 'Clients', route: '/customers', icon: 'people' },
        { label: 'Commandes', route: '/orders', icon: 'receipt_long' }
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Missions', route: '/missions', icon: 'local_shipping' },
        { label: 'Vehicules', route: '/vehicles', icon: 'directions_car' },
        { label: 'Chauffeurs', route: '/drivers', icon: 'badge' },
        { label: 'Carburant', route: '/fuel', icon: 'local_gas_station' },
        { label: 'Entretien', route: '/maintenance', icon: 'build' },
        { label: 'Pieces detachees', route: '/settings', icon: 'extension' }
      ]
    },
    {
      title: 'Finance & systeme',
      items: [
        { label: 'Comptabilite', route: '/finance', icon: 'account_balance_wallet' },
        { label: 'Notifications', route: '/notifications', icon: 'notifications' },
        { label: 'Documents', route: '/documents', icon: 'description' },
        { label: 'Administration', route: '/admin', icon: 'admin_panel_settings' }
      ]
    }
  ];

  logout(): void {
    this.authService.logout();
  }
}
