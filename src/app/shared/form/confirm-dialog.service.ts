import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmation</h2>
    <mat-dialog-content>{{ message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Supprimer</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  message = 'Confirmer la suppression ?';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(message = 'Confirmer la suppression ?'): Observable<boolean> {
    return this.dialog
      .open(ConfirmDialogComponent, { data: {}, width: '400px' })
      .afterClosed();
  }
}
