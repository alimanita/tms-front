import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexStroke, ApexXAxis } from 'ng-apexcharts';
import { jwtDecode } from 'jwt-decode';
import { DashboardActions } from '../../store/dashboard/dashboard.actions';
import { selectData, selectError, selectLoading } from '../../store/dashboard/dashboard.reducer';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, DecimalPipe, MatCardModule, MatProgressSpinnerModule, MatIconModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly store  = inject(Store);
  private readonly router = inject(Router);

  protected readonly data$    = this.store.select(selectData);
  protected readonly loading$ = this.store.select(selectLoading);
  protected readonly error$   = this.store.select(selectError);

  protected readonly chart: ApexChart = { type: 'area', height: 320, toolbar: { show: false } };
  protected readonly stroke: ApexStroke = { curve: 'smooth', width: 2 };
  protected readonly dataLabels: ApexDataLabels = { enabled: false };

  ngOnInit(): void {
    if (this.redirectIfChauffeur()) {
      return;
    }
    this.store.dispatch(DashboardActions.load());
  }

  /**
   * Vérifie le rôle dans le JWT et redirige le chauffeur vers son propre dashboard.
   * Retourne true si une redirection a été effectuée (pour stopper le chargement du store).
   */
private redirectIfChauffeur(): boolean {
  const accessToken = localStorage.getItem('tms_access_token');
  if (!accessToken) return false;

  try {
    const decoded: any = jwtDecode(accessToken);
    console.log('JWT décodé:', decoded);

    let roles: string[] = [];
    if (Array.isArray(decoded.roles))            roles = decoded.roles;
    else if (Array.isArray(decoded.authorities)) roles = decoded.authorities;
    else if (typeof decoded.role === 'string')   roles = [decoded.role];

    const isChauffeur = roles.some(r =>
      r === 'CHAUFFEUR' || r === 'ROLE_CHAUFFEUR' || r.replace('ROLE_', '') === 'CHAUFFEUR'
    );

    if (isChauffeur) {
      this.router.navigate(['/fleet/chauffeur-dashboard']);
      return true;
    }

    return false;
  } catch (e) {
    console.error('Erreur extraction rôle Token', e);
    return false;
  }
}

  buildSeries(data: { monthlyRevenue: { amount: number }[]; monthlyExpenses: { amount: number }[] }): ApexAxisChartSeries {
    return [
      { name: 'Revenus', data: data.monthlyRevenue.map((item) => item.amount) },
      { name: 'Depenses', data: data.monthlyExpenses.map((item) => item.amount) }
    ];
  }

  buildXAxis(data: { monthlyRevenue: { month: string }[] }): ApexXAxis {
    return { categories: data.monthlyRevenue.map((item) => item.month) };
  }
}