import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { notificationFields } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface NotificationRow { id: number; type: string; severity: string; title: string; message?: string; readFlag: boolean; }

@Component({
  selector: 'app-notification-list',
  imports: [CrudTableComponent, MatButtonModule],
  providers: [CrudHelper,TmsApiService],
  template: `
    <app-crud-table title="Notifications" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="markRead($event)" (removeClick)="remove($event)" />
  `
})
export class NotificationListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  protected readonly loading = signal(true);
  protected readonly rows = signal<NotificationRow[]>([]);
  protected readonly columns: CrudColumn<NotificationRow>[] = [
    { key: 'type', label: 'Type' }, { key: 'severity', label: 'Severite' }, { key: 'title', label: 'Titre' },
    { key: 'message', label: 'Message' },
    { key: 'readFlag', label: 'Lu', format: (r) => (r.readFlag ? 'Oui' : 'Non') }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.crud.openCreate(this.api.paths.notifications, 'Nouvelle notification', notificationFields, (v) => v, () => this.reload()); }
  markRead(row: NotificationRow): void { this.api.patch(this.api.paths.notifications, row.id, '/read').subscribe(() => this.reload()); }
  remove(row: NotificationRow): void { this.crud.confirmDelete(this.api.paths.notifications, row.id, () => this.reload()); }
  private reload(): void { this.loading.set(true); this.api.list<NotificationRow>(this.api.paths.notifications).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
