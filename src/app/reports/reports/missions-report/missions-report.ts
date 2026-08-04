import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';

interface MissionStatsDto {
  missionsByDriver: Record<string, number>;
  missionsByStatus: Record<string, number>;
  mileageByDriver:  Record<string, number>;
}

const STATUT_LABELS: Record<string, string> = {
  PLANNED:      'Planifiée',
  IN_PROGRESS:  'En cours',
  COMPLETED:    'Terminée',
  CANCELLED:    'Annulée',
  DELAYED:      'En retard',
};

@Component({
  selector: 'app-reports-missions-report',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './missions-report.html',
  styleUrl: './missions-report.scss'
})
export class MissionsReportComponent implements OnInit {

  loading  = signal(true);
  error    = signal<string | null>(null);
  rawStats = signal<MissionStatsDto | null>(null);

  /** Liste triée : chauffeur, missions, km */
  missionsParChauffeur = computed(() => {
    const stats = this.rawStats();
    if (!stats) return [];
    const byDriver   = stats.missionsByDriver  ?? {};
    const byMileage  = stats.mileageByDriver   ?? {};
    return Object.keys(byDriver).map(name => ({
      chauffeur: name,
      missions:  byDriver[name]  ?? 0,
      km:        byMileage[name] ?? 0,
    })).sort((a, b) => b.missions - a.missions);
  });

  missionsParStatut = computed(() => {
    const stats = this.rawStats();
    if (!stats) return [];
    return Object.entries(stats.missionsByStatus ?? {}).map(([statut, count]) => ({
      statut: STATUT_LABELS[statut] ?? statut,
      count,
    }));
  });

  totalMissions = computed(() =>
    this.missionsParStatut().reduce((s, i) => s + i.count, 0)
  );

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<MissionStatsDto>(`${environment.baseUrl}/fleet/rapports/missions/stats`)
      .subscribe({
        next: data => { this.rawStats.set(data); this.loading.set(false); },
        error: err  => { this.error.set('Erreur lors du chargement des données.'); this.loading.set(false); console.error(err); }
      });
  }

  goBack() { this.router.navigate(['/reports']); }
}
