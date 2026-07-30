import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { machineFields, mapMachineBody } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface MachineRow {
  id: number;
  reference: string;
  name: string;
  brand?: string;
  currentHours: number;
  status: string;
}

@Component({
  selector: 'app-machine-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper, DecimalPipe],
  template: `<app-crud-table title="Machines" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class MachineListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<MachineRow[]>([]);
  protected readonly columns: CrudColumn<MachineRow>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'name', label: 'Nom' },
    { key: 'brand', label: 'Marque' },
    { key: 'currentHours', label: 'Heures', format: (r) => this.decimalPipe.transform(r.currentHours, '1.0-1') ?? '' },
    { key: 'status', label: 'Statut' }
  ];

  ngOnInit(): void { this.reload(); }

  create(): void {
    this.crud.openCreate(this.api.paths.machines, 'Nouvelle machine', machineFields, mapMachineBody, () => this.reload());
  }

  edit(row: MachineRow): void {
    this.api.get<MachineRow & Record<string, unknown>>(this.api.paths.machines, row.id).subscribe((detail) => {
      this.crud.openEdit(this.api.paths.machines, 'Modifier machine', machineFields, row, () => ({
        reference: detail.reference,
        serialNumber: detail['serialNumber'],
        name: detail.name,
        brand: detail.brand,
        model: detail['model'],
        category: detail['category'],
        purchaseDate: detail['purchaseDate'],
        purchasePrice: detail['purchasePrice'],
        powerUnit: detail['powerUnit'],
        powerValue: detail['powerValue'],
        initialHours: detail['initialHours'],
        currentHours: detail.currentHours,
        location: detail['location'],
        status: detail.status,
        notes: detail['notes']
      }), mapMachineBody, () => this.reload());
    });
  }

  remove(row: MachineRow): void {
    this.crud.confirmDelete(this.api.paths.machines, row.id, () => this.reload());
  }

  private reload(): void {
    this.loading.set(true);
    this.api.list<MachineRow>(this.api.paths.machines).subscribe({
      next: (p) => { this.rows.set(p.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
