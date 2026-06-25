import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { financialFields } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface FinanceRow { id: number; entryDate: string; entryType: string; category: string; amount: number; description?: string; }

@Component({
  selector: 'app-finance-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper],
  template: `<app-crud-table title="Comptabilite" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class FinanceListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<FinanceRow[]>([]);
  protected readonly columns: CrudColumn<FinanceRow>[] = [
    { key: 'entryDate', label: 'Date', format: (r) => this.datePipe.transform(r.entryDate, 'dd/MM/yyyy') ?? '' },
    { key: 'entryType', label: 'Type' }, { key: 'category', label: 'Categorie' },
    { key: 'amount', label: 'Montant', format: (r) => `${this.decimalPipe.transform(r.amount, '1.2-2')} EUR` },
    { key: 'description', label: 'Description' }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.crud.openCreate(this.api.paths.financialEntries, 'Nouvelle ecriture', financialFields, (v) => v, () => this.reload()); }
  edit(row: FinanceRow): void { this.crud.openEdit(this.api.paths.financialEntries, 'Modifier ecriture', financialFields, row, (r) => ({ ...r }), (v) => v, () => this.reload()); }
  remove(row: FinanceRow): void { this.crud.confirmDelete(this.api.paths.financialEntries, row.id, () => this.reload()); }
  private reload(): void { this.loading.set(true); this.api.list<FinanceRow>(this.api.paths.financialEntries).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
