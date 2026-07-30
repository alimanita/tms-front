import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { mapTireBody, tireFields } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface TireRow {
  id: number;
  serialNumber: string;
  brand?: string;
  size?: string;
  status: string;
  purchaseCost?: number;
}

@Component({
  selector: 'app-tire-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper, DecimalPipe],
  template: `<app-crud-table title="Pneus" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class TireListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<TireRow[]>([]);
  protected readonly columns: CrudColumn<TireRow>[] = [
    { key: 'serialNumber', label: 'N serie' },
    { key: 'brand', label: 'Marque' },
    { key: 'size', label: 'Dimension' },
    { key: 'status', label: 'Statut' },
    { key: 'purchaseCost', label: 'Prix', format: (r) => r.purchaseCost != null ? `${this.decimalPipe.transform(r.purchaseCost, '1.2-2')} EUR` : '' }
  ];

  ngOnInit(): void { this.reload(); }

  create(): void {
    this.crud.openCreate(this.api.paths.tires, 'Nouveau pneu', tireFields, mapTireBody, () => this.reload());
  }

  edit(row: TireRow): void {
    this.api.get<TireRow & Record<string, unknown>>(this.api.paths.tires, row.id).subscribe((detail) => {
      this.crud.openEdit(this.api.paths.tires, 'Modifier pneu', tireFields, row, () => ({
        serialNumber: detail.serialNumber,
        brand: detail.brand,
        model: detail['model'],
        size: detail.size,
        type: detail['type'],
        purchaseDate: detail['purchaseDate'],
        purchaseCost: detail.purchaseCost,
        maxKm: detail['maxKm'],
        status: detail.status
      }), mapTireBody, () => this.reload());
    });
  }

  remove(row: TireRow): void {
    this.crud.confirmDelete(this.api.paths.tires, row.id, () => this.reload());
  }

  private reload(): void {
    this.loading.set(true);
    this.api.list<TireRow>(this.api.paths.tires).subscribe({
      next: (p) => { this.rows.set(p.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
