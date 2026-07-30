import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, DocumentFlotteResponse } from '../../fleet.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss'],
})
export class DocumentListComponent implements OnInit {
  documents: DocumentFlotteResponse[] = [];
  loading = false;

  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
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

  downloadFile(d: DocumentFlotteResponse): void {
    if (!d.fileName) {
      this.snackBar.open('Aucun fichier joint', 'Fermer', { duration: 3000 });
      return;
    }
    this.fleetService.getDocumentFile(d.id).subscribe({
      next: (res: any) => {
        const url = window.URL.createObjectURL(res.body);
        const a = document.createElement('a');
        a.href = url;
        a.download = d.fileName || 'document';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erreur de téléchargement', 'Fermer', { duration: 3000 })
    });
  }
}
