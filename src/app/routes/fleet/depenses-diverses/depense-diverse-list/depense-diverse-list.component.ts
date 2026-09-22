import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { FleetService } from '../../fleet.service';
import { ChauffeurResponse } from '../../chauffeurs/chauffeur.model';
import { PaginationBarComponent, PageChangeEvent } from '../../../../shared/components/pagination-bar/pagination-bar.component';
import { isAdminRole } from 'app/core/authentication/helpers';
import {
  DepenseDiverseResponse,
  DepenseDiverseSummaryResponse,
  CATEGORIES_DEPENSE,
  categorieLabel,
} from '../depense-diverse.model';

@Component({
  selector: 'app-depense-diverse-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, FormsModule, MatIconModule, PaginationBarComponent],
  templateUrl: './depense-diverse-list.component.html',
  styleUrls: ['./depense-diverse-list.component.scss'],
})
export class DepenseDiverseListComponent implements OnInit {
  isAdmin = isAdminRole();

  depenses: DepenseDiverseResponse[] = [];
  chauffeurs: ChauffeurResponse[] = [];
  categories = CATEGORIES_DEPENSE;
  categorieLabel = categorieLabel;

  selectedChauffeurId?: number | '';
  selectedCategorie?: string | '';
  startDate?: string;
  endDate?: string;

  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;
  summaryTotalTTC = 0;
  summaryCount = 0;

  loading = false;

  sortCriteria: { column: string; direction: 'asc' | 'desc' }[] = [
    { column: 'dateDepense', direction: 'desc' },
  ];

  selectedIds: Set<number> = new Set();

  // Proof modal
  proofModalOpen = false;
  proofLoading = false;
  proofIsImage = false;
  proofSafeUrl: SafeUrl | null = null;
  currentProofId: number | null = null;
  currentProofRef = '';
  private currentProofBlobUrl: string | null = null;

  constructor(
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.fleetService.getChauffeurs({ size: 1000 }).subscribe({
      next: (page: any) => (this.chauffeurs = page.content ?? page),
      error: () => {},
    });

    this.route.queryParams.subscribe(qp => {
      this.selectedChauffeurId = qp['chauffeurId'] ? +qp['chauffeurId'] : '';
      this.selectedCategorie = qp['categorie'] || '';
      this.startDate = qp['startDate'] || '';
      this.endDate = qp['endDate'] || '';
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize,
      chauffeurId: this.selectedChauffeurId || undefined,
      categorie: this.selectedCategorie || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
    };
    if (this.sortCriteria.length > 0) {
      params.sort = this.sortCriteria.map(c => `${c.column},${c.direction}`);
    }

    this.fleetService.getDepensesDiverses(params).subscribe({
      next: (data: any) => {
        this.depenses = Array.isArray(data) ? data : (data.content ?? []);
        this.totalElements = data.totalElements ?? this.depenses.length;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loading = false;
      },
    });

    // Summary
    const summaryParams: any = {
      chauffeurId: this.selectedChauffeurId || undefined,
      categorie: this.selectedCategorie || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
    };
    this.fleetService.getDepenseDiverseSummary(summaryParams).subscribe({
      next: (s: any) => {
        this.summaryTotalTTC = s?.totalAmountTTC ?? 0;
        this.summaryCount = s?.totalCount ?? 0;
      },
      error: () => {},
    });
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.load();
  }

  onFilterChange(): void {
    this.router.navigate([], {
      queryParams: {
        chauffeurId: this.selectedChauffeurId || null,
        categorie: this.selectedCategorie || null,
        startDate: this.startDate || null,
        endDate: this.endDate || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  resetFilters(): void {
    this.selectedChauffeurId = '';
    this.selectedCategorie = '';
    this.startDate = '';
    this.endDate = '';
    this.onFilterChange();
  }

  onPageChange(event: PageChangeEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  // ── Sort ──────────────────────────────────────────────────────────

  getSortDirection(column: string): 'asc' | 'desc' | null {
    return this.sortCriteria.find(c => c.column === column)?.direction ?? null;
  }

  getSortRank(column: string): number | null {
    const idx = this.sortCriteria.findIndex(c => c.column === column);
    return idx >= 0 ? idx + 1 : null;
  }

  sortBy(column: string): void {
    const idx = this.sortCriteria.findIndex(c => c.column === column);
    if (idx >= 0) {
      if (this.sortCriteria[idx].direction === 'desc') {
        this.sortCriteria[idx] = { column, direction: 'asc' };
      } else {
        this.sortCriteria.splice(idx, 1);
      }
    } else {
      this.sortCriteria.unshift({ column, direction: 'desc' });
    }
    this.applyFilters();
  }

  // ── Actions ───────────────────────────────────────────────────────

  addDepense(): void {
    this.router.navigate(['/fleet/depenses-diverses/new']);
  }

  goEdit(d: DepenseDiverseResponse): void {
    this.router.navigate([`/fleet/depenses-diverses/${d.id}/edit`]);
  }

  delete(d: DepenseDiverseResponse): void {
    if (!confirm('Supprimer cette dépense ?')) return;
    this.fleetService.deleteDepenseDiverse(d.id).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 }),
    });
  }

  // ── Selection ─────────────────────────────────────────────────────

  toggleSelection(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  toggleAll(event: any): void {
    if (event.target.checked) this.depenses.forEach(d => this.selectedIds.add(d.id));
    else this.selectedIds.clear();
  }

  isAllSelected(): boolean {
    return this.depenses.length > 0 && this.depenses.every(d => this.selectedIds.has(d.id));
  }

  // ── Export CSV ────────────────────────────────────────────────────

  exportCSV(): void {
    if (this.selectedIds.size === 0) return;
    const selected = this.depenses.filter(d => this.selectedIds.has(d.id));
    let csv = 'ID,Référence,Date,Chauffeur,Véhicule,Catégorie,Description,Montant TTC,N° Reçu\n';
    selected.forEach(d => {
      csv += `${d.id},${d.reference},${d.dateDepense || ''},${d.chauffeurNom || ''},${d.vehiculeImmatriculation || ''},${categorieLabel(d.categorie)},"${d.description || ''}",${d.amountTTC || ''},${d.receiptNumber || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'depenses_diverses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ── Proof modal ───────────────────────────────────────────────────

  viewProof(depenseId: number, reference = ''): void {
    this.proofModalOpen = true;
    this.proofLoading = true;
    this.currentProofId = depenseId;
    this.currentProofRef = reference;

    this.fleetService.getDepenseDiverseProofFile(depenseId).subscribe({
      next: (res: any) => {
        const blob = res.body!;
        const contentType = res.headers.get('Content-Type') || blob.type;
        this.proofIsImage = contentType.startsWith('image/');
        const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
        this.currentProofBlobUrl = url;
        this.proofSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.proofLoading = false;
      },
      error: () => {
        this.proofLoading = false;
        this.snackBar.open('Impossible de charger le justificatif', 'Fermer', { duration: 3000 });
        this.proofModalOpen = false;
      },
    });
  }

  downloadProof(depenseId: number, filename = 'justificatif'): void {
    this.fleetService.getDepenseDiverseProofFile(depenseId).subscribe({
      next: (res: any) => {
        const blob = res.body!;
        const disposition = res.headers.get('Content-Disposition');
        const match = disposition?.match(/filename="(.+)"/);
        const finalName = match?.[1] ?? filename;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erreur téléchargement', 'Fermer', { duration: 3000 }),
    });
  }

  closeProofModal(): void {
    this.proofModalOpen = false;
    if (this.currentProofBlobUrl) {
      window.URL.revokeObjectURL(this.currentProofBlobUrl);
      this.currentProofBlobUrl = null;
    }
    this.proofSafeUrl = null;
  }
}
