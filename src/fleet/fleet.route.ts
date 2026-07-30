import { Routes } from '@angular/router';
import { MachineMaintenanceRulesListComponent } from './machine-maintenance/machine-maintenance-rules-list/machine-maintenance-rules-list.component';
import { MissionListComponent } from './mission/mission-list/mission-list.component';
import { MissionDetailComponent } from './mission/mission-detail/mission-detail.component';

export const routes : Routes = [
  {
    path: 'vehicles',
    loadComponent: () =>
      import('./vehicles/vehicle-list/vehicle-list.component')
        .then(m => m.VehicleListComponent),
  },
  {
    path: 'vehicles/new',
    loadComponent: () =>
      import('./vehicles/vehicle-form/vehicle-form.component')
        .then(m => m.VehicleFormComponent),
  },
  {
    path: 'vehicles/:id/edit',
    loadComponent: () =>
      import('./vehicles/vehicle-form/vehicle-form.component')
        .then(m => m.VehicleFormComponent),
  },
  {
    path: 'fuel-fillings',
    loadComponent: () =>
      import('./fuel-fillings/fuel-list/fuel-list.component')
        .then(m => m.FuelListComponent),
  },
  {
    path: 'fuel-fillings/new',
    loadComponent: () =>
      import('./fuel-fillings/fuel-form/fuel-form.component')
        .then(m => m.FuelFormComponent),
  },
  {
    path: 'fuel-fillings/:id/edit',
    loadComponent: () =>
      import('./fuel-fillings/fuel-form/fuel-form.component')
        .then(m => m.FuelFormComponent),
  },
  { path: '', redirectTo: 'vehicles', pathMatch: 'full' },

  {
    path: 'machines',
    loadComponent: () =>
      import('./machines/machine-list/machine-list.component')
        .then(m => m.MachineListComponent ),
  },
  {
    path: 'machines/new',
    loadComponent: () =>
      import('./machines/machine-form/machine-form.component')
        .then(m => m.MachineFormComponent),
  },
  {
    path: 'machines/:id/edit',
    loadComponent: () =>
      import('./machines/machine-form/machine-form.component')
        .then(m => m.MachineFormComponent),
  },
  {
    path: 'machines/:machineId/stats-syage',
    loadComponent: () =>
      import('./machines/stats-syage/stats-syage.component')
        .then(m => m.StatsSyageComponent),
  },
  {
    path: 'chauffeurs',
    loadComponent: () =>
      import('./chauffeurs/chauffeur-list/chauffeur-list.component')
        .then(m => m.ChauffeurListComponent),
  },
  {
    path: 'chauffeurs/new',
    loadComponent: () =>
      import('./chauffeurs/chauffeur-form/chauffeur-form.component')
        .then(m => m.ChauffeurFormComponent),
  },
  {
    path: 'chauffeurs/:id/edit',
    loadComponent: () =>
      import('./chauffeurs/chauffeur-form/chauffeur-form.component')
        .then(m => m.ChauffeurFormComponent),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./notifications/notification-list/notification-list.component')
        .then(m => m.NotificationListComponent),
  },
  {
  path: 'machines/:machineId/maintenance',
  component: MachineMaintenanceRulesListComponent,
},
{ path: 'missions', component: MissionListComponent },
{
  path: 'missions/new',
  loadComponent: () => import('./mission/mission-form/mission-form.component').then(m => m.MissionFormComponent),
},
{
  path: 'missions/:id/edit',
  loadComponent: () => import('./mission/mission-form/mission-form.component').then(m => m.MissionFormComponent),
},
{ path: 'missions/:id', component: MissionDetailComponent },

{path : 'maintenances', loadComponent: () => import('./ordre-travail/entretien-list/entretien-list.component').then(m => m.EntretienListComponent)},
{
  path: 'pieces-rechange',
  loadComponent: () => import('./piece-rechange/piece-rechange-list/piece-rechange-list.component').then(m => m.PieceRechangeListComponent),
},

// ── Nouveaux modules TMS ───────────────────────────────────────────
{
  path: 'pneus',
  loadComponent: () => import('./pneus/pneu-list/pneu-list.component').then(m => m.PneuListComponent),
},
{
  path: 'pneus/new',
  loadComponent: () => import('./pneus/pneu-form/pneu-form.component').then(m => m.PneuFormComponent),
},
{
  path: 'pneus/:id/edit',
  loadComponent: () => import('./pneus/pneu-form/pneu-form.component').then(m => m.PneuFormComponent),
},
{
  path: 'affectation-pneus',
  loadComponent: () => import('./affectation-pneu/affectation-list/affectation-list.component').then(m => m.AffectationListComponent),
},
{
  path: 'affectation-pneus/new',
  loadComponent: () => import('./affectation-pneu/affectation-form/affectation-form.component').then(m => m.AffectationFormComponent),
},
{
  path: 'changement-huile',
  loadComponent: () => import('./changement-huile/changement-huile-list/changement-huile-list.component').then(m => m.ChangementHuileListComponent),
},
{
  path: 'changement-huile/new',
  loadComponent: () => import('./changement-huile/changement-huile-form/changement-huile-form.component').then(m => m.ChangementHuileFormComponent),
},
{
  path: 'changement-huile/:id/edit',
  loadComponent: () => import('./changement-huile/changement-huile-form/changement-huile-form.component').then(m => m.ChangementHuileFormComponent),
},
{
  path: 'documents',
  loadComponent: () => import('./documents/document-list/document-list.component').then(m => m.DocumentListComponent),
},
{
  path: 'documents/new',
  loadComponent: () => import('./documents/document-form/document-form.component').then(m => m.DocumentFormComponent),
},
{
  path: 'documents/:id/edit',
  loadComponent: () => import('./documents/document-form/document-form.component').then(m => m.DocumentFormComponent),
},

// ── Dashboards par rôle ───────────────────────────────────────────
{
  path: 'mecanicien-dashboard',
  loadComponent: () =>
    import('./mecanicien-dashboard/mecanicien-dashboard.component')
      .then(m => m.MecanicienDashboardComponent),
},
{
  path: 'chauffeur-dashboard',
  loadComponent: () =>
    import('../app/chauffeur-dashboard/chauffeur-dashboard.component')
      .then(m => m.ChauffeurDashboardComponent),
},
];




