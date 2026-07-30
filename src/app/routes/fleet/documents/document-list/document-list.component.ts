import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, DocumentFlotteResponse } from '../../fleet.service';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, MatIconModule],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss'],
})
export class DocumentListComponent implements OnInit {
  documents: DocumentFlotteResponse[] = [];
  loading = false;

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
        this.documents = page.content ?? page;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
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
}
