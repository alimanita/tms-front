import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { sparePartFields } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface SparePartRow { id: number; reference: string; designation: string; category?: string; stockQty: number; minThreshold: number; purchasePrice?: number; }

@Component({
  selector: 'app-spare-part-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper,DecimalPipe],
  template: `<app-crud-table title="Pieces detachees" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class SparePartListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<SparePartRow[]>([]);
  protected readonly columns: CrudColumn<SparePartRow>[] = [
    { key: 'reference', label: 'Reference' }, { key: 'designation', label: 'Designation' }, { key: 'category', label: 'Categorie' },
    { key: 'stockQty', label: 'Stock' }, { key: 'minThreshold', label: 'Seuil' },
    { key: 'purchasePrice', label: 'Prix', format: (r) => `${this.decimalPipe.transform(r.purchasePrice, '1.2-2')} EUR` }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.crud.openCreate(this.api.paths.spareParts, 'Nouvelle piece', sparePartFields, (v) => v, () => this.reload()); }
  edit(row: SparePartRow): void { this.crud.openEdit(this.api.paths.spareParts, 'Modifier piece', sparePartFields, row, (r) => ({ ...r }), (v) => v, () => this.reload()); }
  remove(row: SparePartRow): void { this.crud.confirmDelete(this.api.paths.spareParts, row.id, () => this.reload()); }
  private reload(): void { this.loading.set(true); this.api.list<SparePartRow>(this.api.paths.spareParts).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
