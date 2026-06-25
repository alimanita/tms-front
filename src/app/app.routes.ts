import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { ComingSoonComponent } from './features/shared/coming-soon/coming-soon.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'fleet-tracking', loadComponent: () => import('./features/fleet/fleet-tracking.component').then((m) => m.FleetTrackingComponent) },
      { path: 'amazon-purchases', loadComponent: () => import('./features/amazon-purchases/amazon-purchase-list.component').then((m) => m.AmazonPurchaseListComponent) },
      { path: 'customers', loadComponent: () => import('./features/customers/customer-list.component').then((m) => m.CustomerListComponent) },
      { path: 'orders', loadComponent: () => import('./features/orders/order-list.component').then((m) => m.OrderListComponent) },
      { path: 'vehicles', loadComponent: () => import('./features/fleet/vehicle-list.component').then((m) => m.VehicleListComponent) },
      { path: 'maintenance', loadComponent: () => import('./features/maintenance/maintenance-list.component').then((m) => m.MaintenanceListComponent) },
      { path: 'spare-parts', loadComponent: () => import('./features/spare-parts/spare-part-list.component').then((m) => m.SparePartListComponent) },
      { path: 'drivers', loadComponent: () => import('./features/drivers/driver-list.component').then((m) => m.DriverListComponent) },
      { path: 'fuel', loadComponent: () => import('./features/fuel/fuel-list.component').then((m) => m.FuelListComponent) },
      { path: 'missions', loadComponent: () => import('./features/missions/mission-list.component').then((m) => m.MissionListComponent) },
      { path: 'finance', loadComponent: () => import('./features/finance/finance-list.component').then((m) => m.FinanceListComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notification-list.component').then((m) => m.NotificationListComponent) },
      { path: 'documents', component: ComingSoonComponent, data: { title: 'Gestion documentaire', description: 'Upload factures, contrats, permis et bons de livraison.' } },
      { path: 'admin', component: ComingSoonComponent, data: { title: 'Administration', description: 'Utilisateurs, roles et securite RBAC.' } }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
