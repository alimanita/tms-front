import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { ComingSoonComponent } from './features/shared/coming-soon/coming-soon.component';
import { Register } from './register/register';

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

      // ── Dashboard & Suivi ────────────────────────────────────────────
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'fleet-tracking', loadComponent: () => import('./features/fleet/fleet-tracking.component').then((m) => m.FleetTrackingComponent) },

      // ── Module Flotte (lazy loaded) ───────────────────────────────────
      {
        path: 'fleet',
        loadChildren: () => import('./routes/fleet/fleet.route').then(m => m.routes)
      },

      // ── Commercial ───────────────────────────────────────────────────
      { path: 'amazon-purchases', loadComponent: () => import('./features/amazon-purchases/amazon-purchase-list.component').then((m) => m.AmazonPurchaseListComponent) },
      { path: 'customers', loadComponent: () => import('./features/customers/customer-list.component').then((m) => m.CustomerListComponent) },
      { path: 'orders', loadComponent: () => import('./features/orders/order-list.component').then((m) => m.OrderListComponent) },
   // ✅ Rapports
      { path: 'reports', loadChildren: () => import('./reports/reports.routes').then(m => m.routes) },

      // ── Finance & Administration ──────────────────────────────────────
      { path: 'finance', loadComponent: () => import('./features/finance/finance-list.component').then((m) => m.FinanceListComponent) },
      { 
        path: 'admin', 
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        children: [
          { path: '', redirectTo: 'users', pathMatch: 'full' },
          { path: 'users', loadChildren: () => import('./utilisateur/utilisateur.route').then(m => m.routes) },
          { path: 'roles', loadComponent: () => import('../app/roles/roles').then(m => m.SettingsSettingsRoles) }
        ]
      }
    ]
  },
  {path:'auth/register',component : Register},
  {
  path: 'fleet/chauffeur-dashboard',
  loadComponent: () =>
    import('../app/chauffeur-dashboard/chauffeur-dashboard.component')
      .then(m => m.ChauffeurDashboardComponent),
},
  { path: '**', redirectTo: 'dashboard' }
];
