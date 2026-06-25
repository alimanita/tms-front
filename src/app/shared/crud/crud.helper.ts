import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { TmsApiService } from '../../core/services/tms-api.service';
import { FormDialogService } from '../form/form-dialog.service';
import { ConfirmDialogComponent } from '../form/confirm-dialog.service';
import { FormField } from '../form/form-field.model';

export interface CrudColumn<T> {
  key: keyof T & string;
  label: string;
  format?: (row: T) => string;
}

@Injectable()
export class CrudHelper {
  private readonly api = inject(TmsApiService);
  private readonly formDialog = inject(FormDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  load<T>(path: string): Observable<T[]> {
    return new Observable((observer) => {
      this.api.list<T>(path).subscribe({
        next: (page) => {
          observer.next(page.content);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  openCreate(path: string, title: string, fields: FormField[], mapBody: (v: Record<string, unknown>) => unknown, reload: () => void): void {
    this.formDialog.openWithFields(title, fields).subscribe((value) => {
      if (!value) return;
      this.api.create(path, mapBody(value)).subscribe({
        next: () => {
          this.snack.open('Enregistre avec succes', 'OK', { duration: 2500 });
          reload();
        },
        error: () => this.snack.open('Erreur lors de la creation', 'OK', { duration: 3000 })
      });
    });
  }

  openEdit<T extends { id: number }>(
    path: string,
    title: string,
    fields: FormField[],
    row: T,
    mapValue: (row: T) => Record<string, unknown>,
    mapBody: (v: Record<string, unknown>) => unknown,
    reload: () => void
  ): void {
    this.formDialog.openWithFields(title, fields, mapValue(row)).subscribe((value) => {
      if (!value) return;
      this.api.update(path, row.id, mapBody(value)).subscribe({
        next: () => {
          this.snack.open('Modifie avec succes', 'OK', { duration: 2500 });
          reload();
        },
        error: () => this.snack.open('Erreur lors de la modification', 'OK', { duration: 3000 })
      });
    });
  }

  confirmDelete(path: string, id: number, reload: () => void): void {
    this.dialog
      .open(ConfirmDialogComponent, { width: '400px' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.api.delete(path, id).subscribe({
          next: () => {
            this.snack.open('Supprime avec succes', 'OK', { duration: 2500 });
            reload();
          },
          error: () => this.snack.open('Erreur lors de la suppression', 'OK', { duration: 3000 })
        });
      });
  }
}
