import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, DocumentFlotteResponse } from '../../fleet.service';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { PaginationBarComponent, PageChangeEvent } from 'app/shared/components/pagination-bar/pagination-bar.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatIconModule, PaginationBarComponent],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss'],
})
export class DocumentListComponent implements OnInit {
  allDocuments: DocumentFlotteResponse[] = [];
  documents: DocumentFlotteResponse[] = [];
  loading = false;

  // Filtres
  filterType = '';
  filterEntityType = '';
  filterIssuer = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterSearch = '';

  proofModalOpen = false;
  proofLoading = false;
  proofIsImage = false;
  proofSafeUrl: SafeUrl | null = null;
  currentProofId: number | null = null;
  currentProofRef = '';
  private currentProofBlobUrl: string | null = null;

  readonly typeMap: Record<string, string> = {
    'INSURANCE': 'Assurance',
    'TECHNICAL_CONTROL': 'Visite Technique',
    'REGISTRATION': 'Carte Grise',
    'PERMIT': 'Permis / Autorisation',
    'CONTRACT': 'Contrat',
    'PAYSLIP': 'Fiche de paie',
    'OTHER': 'Autre'
  };

  readonly entityMap: Record<string, string> = {
    'VEHICLE': 'Véhicule',
    'MACHINE': 'Machine',
    'DRIVER': 'Chauffeur'
  };

  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.fleetService.getDocumentsFlotte().subscribe({
      next: (page: any) => {
        this.allDocuments = page.content ?? page;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.allDocuments];

    if (this.filterType) {
      result = result.filter(d => d.typeDocument === this.filterType);
    }
    if (this.filterEntityType) {
      result = result.filter(d => d.entityType === this.filterEntityType);
    }
    if (this.filterIssuer.trim()) {
      const term = this.filterIssuer.trim().toLowerCase();
      result = result.filter(d => (d.issuer ?? '').toLowerCase().includes(term));
    }
    if (this.filterDateFrom) {
      result = result.filter(d => d.issueDate && d.issueDate >= this.filterDateFrom);
    }
    if (this.filterDateTo) {
      result = result.filter(d => d.issueDate && d.issueDate <= this.filterDateTo);
    }
    if (this.filterSearch.trim()) {
      const term = this.filterSearch.trim().toLowerCase();
      result = result.filter(d =>
        (d.referenceNumber ?? '').toLowerCase().includes(term) ||
        (d.issuer ?? '').toLowerCase().includes(term) ||
        (d.entityRef ?? '').toLowerCase().includes(term) ||
        (d.notes ?? '').toLowerCase().includes(term)
      );
    }

    this.documents = result;
  }

  resetFilters(): void {
    this.filterType = '';
    this.filterEntityType = '';
    this.filterIssuer = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterSearch = '';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterType || this.filterEntityType || this.filterIssuer ||
              this.filterDateFrom || this.filterDateTo || this.filterSearch);
  }

  goAdd(): void { this.router.navigate(['/fleet/documents/new']); }

  goEdit(d: DocumentFlotteResponse): void { this.router.navigate([`/fleet/documents/${d.id}/edit`]); }

  deleteRecord(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      this.fleetService.deleteDocumentFlotte(id).subscribe({
        next: () => {
          this.snackBar.open('Document supprimé', 'Fermer', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
      });
    }
  }

  downloadFile(dId: number, dRef?: string): void {
    this.fleetService.getDocumentFile(dId).subscribe({
      next: (res: any) => {
        const url = window.URL.createObjectURL(res.body);
        const a = document.createElement('a');
        a.href = url;
        a.download = dRef || 'document';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erreur de téléchargement', 'Fermer', { duration: 3000 })
    });
  }

  viewProof(dId: number, reference = ''): void {
    this.proofModalOpen = true;
    this.proofLoading = true;
    this.currentProofId = dId;
    this.currentProofRef = reference;

    this.fleetService.getDocumentFile(dId).subscribe({
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
      }
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

  formatType(type: string): string {
    return this.typeMap[type] || type;
  }

  formatEntity(type: string): string {
    return this.entityMap[type] || type;
  }

  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;
  private _displayVar = 'documents';

  get paginatedItems(): any[] {
    const start = this.pageIndex * this.pageSize;
    return ((this as any)['documents'] as any[] || []).slice(start, start + this.pageSize);
  }

  onPageChange(e: PageChangeEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

}