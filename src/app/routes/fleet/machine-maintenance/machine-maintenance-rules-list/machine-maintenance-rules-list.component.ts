import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';                          // ← *ngIf, *ngFor, number pipe
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';                // ← mat-table
import { MatButtonModule } from '@angular/material/button';              // ← mat-button
import { MatIconModule } from '@angular/material/icon';                  // ← mat-icon
import { MatTooltipModule } from '@angular/material/tooltip';           // ← matTooltip
import { MatChipsModule } from '@angular/material/chips';               // ← mat-chip
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // ← mat-spinner
import { MachineMaintenanceRuleService } from '../machine-maintenance-rule.service';
import { MachineMaintenanceRuleResponse } from '../machine-maintenance-rule.model';
import { MaintenanceRuleDialogComponent } from '../maintenance-rule-dialog/maintenance-rule-dialog.component';

@Component({
  selector: 'app-machine-maintenance-rules-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MaintenanceRuleDialogComponent,   // ← panneau embarqué directement dans le template, plus de MatDialog
  ],
  templateUrl: './machine-maintenance-rules-list.component.html',
  styleUrl: './machine-maintenance-rules-list.component.scss',
})
export class MachineMaintenanceRulesListComponent implements OnInit {
  private readonly service = inject(MachineMaintenanceRuleService);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly snack   = inject(MatSnackBar);

  machineId = signal<number>(0);
  rules     = signal<MachineMaintenanceRuleResponse[]>([]);
  loading   = signal(false);

  columns = ['code', 'description', 'typeAction', 'intervalle', 'consommable', 'echeance', 'actions'];

  // ── Panneau règle de maintenance ────────────────────────────────────────
  isRuleDialogOpen = false;
  selectedRule: MachineMaintenanceRuleResponse | undefined;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('machineId'));
    this.machineId.set(id);
    this.loadRules();
  }

  loadRules(): void {
    this.loading.set(true);
    this.service.findByMachineId(this.machineId()).subscribe({
      next:  (data) => { this.rules.set(data); this.loading.set(false); },
      error: ()     =>   this.loading.set(false),
    });
  }

  openDialog(rule?: MachineMaintenanceRuleResponse): void {
    this.selectedRule     = rule;
    this.isRuleDialogOpen = true;
  }

  onRuleDialogClosed(): void {
    this.isRuleDialogOpen = false;
    this.selectedRule     = undefined;
  }

  onRuleSaved(): void {
    this.isRuleDialogOpen = false;
    this.selectedRule     = undefined;
    this.snack.open('Règle enregistrée', 'OK', { duration: 3000 });
    this.loadRules();
  }

  marquerEffectuee(rule: MachineMaintenanceRuleResponse): void {
    const heures = rule.dernieresHeuresEffectuees ?? 0;
    this.service.marquerEffectuee(rule.id, heures).subscribe({
      next: () => {
        this.snack.open('Intervention enregistrée', 'OK', { duration: 3000 });
        this.loadRules();
      },
    });
  }

  voirMaintenance(machineId: number): void {
    this.router.navigate(['/fleet/machines', machineId, 'maintenance']);
  }

  delete(rule: MachineMaintenanceRuleResponse): void {
    if (!confirm(`Supprimer la règle "${rule.description}" ?`)) return;
    this.service.delete(rule.id).subscribe({
      next: () => {
        this.snack.open('Règle supprimée', 'OK', { duration: 3000 });
        this.loadRules();
      },
    });
  }

  retourMachines(): void {
    this.router.navigate(['/fleet/machines']);
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      LUBRIFICATION:         'Lubrification',
      VIDANGE:               'Vidange',
      VERIFICATION_NIVEAU:   'Vér. niveau',
      VERIFICATION_TENSION:  'Vér. tension',
      SERRAGE:               'Serrage',
      NETTOYAGE:             'Nettoyage',
      REMPLACEMENT:          'Remplacement',
      AUTRE:                 'Autre',
    };
    return map[type] ?? type;
  }
}