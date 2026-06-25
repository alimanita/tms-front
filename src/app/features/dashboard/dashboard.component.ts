import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexStroke, ApexXAxis } from 'ng-apexcharts';
import { DashboardActions } from '../../store/dashboard/dashboard.actions';
import { selectData, selectError, selectLoading } from '../../store/dashboard/dashboard.reducer';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, DecimalPipe, MatCardModule, MatProgressSpinnerModule, MatIconModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly data$ = this.store.select(selectData);
  protected readonly loading$ = this.store.select(selectLoading);
  protected readonly error$ = this.store.select(selectError);

  protected readonly chart: ApexChart = { type: 'area', height: 320, toolbar: { show: false } };
  protected readonly stroke: ApexStroke = { curve: 'smooth', width: 2 };
  protected readonly dataLabels: ApexDataLabels = { enabled: false };

  ngOnInit(): void {
    this.store.dispatch(DashboardActions.load());
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
