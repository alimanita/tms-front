import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AccountantDashboardResponse {
  totalRevenue: number;
  estimatedVatOnRevenue: number;
  totalFuelExpenses: number;
  estimatedVatOnFuel: number;
  totalTollExpenses: number;
  estimatedVatOnToll: number;
  totalMaintenanceExpenses: number;
  estimatedVatOnMaintenance: number;
  netVatToPay: number;
}

@Component({
  selector: 'app-accountant-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './accountant-dashboard.component.html',
  styleUrls: ['./accountant-dashboard.component.scss']
})
export class AccountantDashboardComponent implements OnInit {
  dashboardData: AccountantDashboardResponse | null = null;
  loading = true;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.http.get<AccountantDashboardResponse>(`${environment.baseUrl}/accountant/dashboard`)
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erreur lors du chargement des données.';
          this.loading = false;
          console.error(err);
        }
      });
  }
}
