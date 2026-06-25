import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { customerFields } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface CustomerRow { id: number; name: string; company?: string; phone?: string; email?: string; city?: string; country?: string; }

@Component({
  selector: 'app-customer-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper],
  template: `<app-crud-table title="Clients" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class CustomerListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  protected readonly loading = signal(true);
  protected readonly rows = signal<CustomerRow[]>([]);
  protected readonly columns: CrudColumn<CustomerRow>[] = [
    { key: 'name', label: 'Nom' }, { key: 'company', label: 'Societe' }, { key: 'phone', label: 'Telephone' },
    { key: 'email', label: 'Email' }, { key: 'city', label: 'Ville' }, { key: 'country', label: 'Pays' }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.crud.openCreate(this.api.paths.customers, 'Nouveau client', customerFields, (v) => v, () => this.reload()); }
  edit(row: CustomerRow): void { this.crud.openEdit(this.api.paths.customers, 'Modifier client', customerFields, row, (r) => ({ ...r }), (v) => v, () => this.reload()); }
  remove(row: CustomerRow): void { this.crud.confirmDelete(this.api.paths.customers, row.id, () => this.reload()); }
  private reload(): void { this.loading.set(true); this.api.list<CustomerRow>(this.api.paths.customers).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
