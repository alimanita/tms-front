import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { OrdreTravailService } from '../../ordre-travail/ordre-travail.service';
import { StatsSyageResponse } from '../../ordre-travail/ordre-travail.model';
import { PageHeader } from '../../../app/shared/page-header/page-header';
import { Breadcrumb } from '../../../app/shared/breadcrumb/breadcrumb';
import { getEntrepriseId } from 'app/core/authentication/helpers';



@Component({
  selector: 'app-stats-syage',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    PageHeader,
    Breadcrumb
  ],
  templateUrl: './stats-syage.component.html',
  styleUrls: ['./stats-syage.component.scss']
})
export class StatsSyageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private otService = inject(OrdreTravailService);

  machineId!: number;
  idEntreprise!: number;

  currentStats: StatsSyageResponse | null = null;
  history: StatsSyageResponse[] = [];
  loading = true;

  displayedColumns: string[] = ['date', 'reference', 'hauteur', 'blocs', 'ofs'];

  ngOnInit() {
    this.machineId = Number(this.route.snapshot.paramMap.get('machineId'));
    this.idEntreprise = getEntrepriseId() ?? 0;
    this.loadData();
  }

  loadData() {
    this.loading = true;
    
    // Load current stats
    this.otService.getStatsSyageMachine(this.machineId, this.idEntreprise).subscribe({
      next: (res) => {
        this.currentStats = res;
      },
      error: (err) => {
        console.error('Error loading stats', err);
      }
    });

    // Load history
    this.otService.getHistoriqueLamesMachine(this.machineId, this.idEntreprise).subscribe({
      next: (res) => {
        this.history = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading history', err);
        this.loading = false;
      }
    });
  }
}
