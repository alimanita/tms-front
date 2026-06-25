import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { FormField, GenericFormDialogData } from './form-field.model';
import { GenericFormDialogComponent } from './generic-form.dialog/generic-form.dialog';

@Injectable({ providedIn: 'root' })
export class FormDialogService {
  private readonly dialog = inject(MatDialog);

  open(data: GenericFormDialogData): Observable<Record<string, unknown> | undefined> {
    return this.dialog
      .open(GenericFormDialogComponent, {
        data,
        width: '460px',
        maxWidth: '100vw',
        height: '100vh',
        position: { right: '0', top: '0', bottom: '0' },
        panelClass: 'samsara-drawer-panel'
      })
      .afterClosed();
  }

  openWithFields(title: string, fields: FormField[], value?: Record<string, unknown>) {
    return this.open({ title, fields, value });
  }
}
